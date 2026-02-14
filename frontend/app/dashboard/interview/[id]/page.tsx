/**
 * AI Interview Page (Candidate Side)
 * Part of the automated recruitment pipeline
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, CheckCircle2, Volume2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import io, { Socket } from 'socket.io-client';
import config from '@/lib/config/api';

interface Message {
  role: 'ai' | 'user';
  text: string;
  audio?: string;
  timestamp: Date;
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const applicationId = params?.id as string;
  const jobId = searchParams?.get('jobId') || '';
  
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const playAudio = (base64Audio: string) => {
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.play().catch(err => console.error('Audio play error:', err));
    } catch (err) {
      console.error('Audio creation error:', err);
    }
  };

  const handleInterviewComplete = async () => {
    setIsComplete(true);
    toast.success('Interview completed! Evaluating your performance...');

    // PIPELINE STEP 3: Auto-evaluate interview
    try {
      const response = await fetch(`${config.apiUrl}/api/evaluation/evaluate-interview/${applicationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      
      if (data.final_score !== undefined) {
        setFinalScore(data.final_score);
        
        toast.success(
          <div>
            <div className="font-semibold">🎉 Evaluation Complete!</div>
            <div className="text-sm mt-1">
              Final Score: {data.final_score}/100
            </div>
            <div className="text-xs mt-1">
              Resume ({data.round1_score}) + Interview ({data.round2_score})
            </div>
          </div>,
          { duration: 5000 }
        );

        // Redirect to results page after 3 seconds
        setTimeout(() => {
          router.push(`/dashboard/interview/results/${applicationId}`);
        }, 3000);
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      toast.error('Interview saved but evaluation pending');
    }
  };

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io(config.wsUrl);
    socketRef.current = newSocket;

    // Listen for AI responses
    newSocket.on('ai_response', (data: any) => {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.text,
        audio: data.audio,
        timestamp: new Date()
      }]);
      
      setCurrentQuestion(data.questionNumber || 0);
      setIsProcessing(false);
      
      // Auto-play AI audio
      if (data.audio) {
        playAudio(data.audio);
      }
      
      // Check if interview is complete
      if (data.isComplete) {
        handleInterviewComplete();
      }
    });

    // Listen for transcriptions
    newSocket.on('user_transcript', (data: any) => {
      setMessages(prev => [...prev, {
        role: 'user',
        text: data.text,
        timestamp: new Date()
      }]);
    });

    newSocket.on('error', (error: any) => {
      toast.error(error.message || 'Interview error occurred');
      setIsProcessing(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startInterview = async () => {
    if (!socketRef.current) return;

    try {
      // Fetch job details and application data
      const [jobResponse, appResponse] = await Promise.all([
        fetch(`${config.apiUrl}/api/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch(`${config.apiUrl}/api/applications/${applicationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
      ]);

      const job = await jobResponse.json();
      const application = await appResponse.json();

      // Build candidate context from resume/application data
      const candidateContext = `
Resume Summary:
- Name: ${application.profileSnapshot?.firstName || user?.firstName} ${application.profileSnapshot?.lastName || user?.lastName}
- Email: ${application.profileSnapshot?.email || user?.email}
- Skills: ${(application.profileSnapshot?.skills || []).join(', ')}
- Experience: ${JSON.stringify(application.profileSnapshot?.experience || {})}
- Education: ${JSON.stringify(application.profileSnapshot?.education || [])}
- Projects: ${JSON.stringify(application.profileSnapshot?.projects || [])}
      `.trim();

      // Start interview via WebSocket with full context
      socketRef.current?.emit('start_interview', {
        jobId,
        applicationId,
        candidateId: user?.userId,
        candidateName: `${user?.firstName} ${user?.lastName}`,
        jdText: job.description,
        candidateContext // Pass parsed resume data for contextual questions
      });

      setInterviewStarted(true);
      toast.success('Interview started! AI will ask 10 contextual questions based on your resume.');
    } catch (error) {
      toast.error('Failed to start interview');
      console.error(error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording... Click again to stop');
    } catch (error) {
      toast.error('Microphone access denied');
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const sendAudio = async (audioBlob: Blob) => {
    if (!socketRef.current) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        socketRef.current?.emit('send_audio', { audio: base64 });
      };
      reader.readAsDataURL(audioBlob);
    } catch (_error) {
      toast.error('Failed to send audio');
      setIsProcessing(false);
    }
  };

  const sendText = () => {
    if (!socketRef.current || !textInput.trim()) return;

    setIsProcessing(true);
    socketRef.current?.emit('send_text', { text: textInput });
    setTextInput('');
  };

  const progress = currentQuestion > 0 ? (currentQuestion / 10) * 100 : 0;

  return (
    <ProtectedRoute requiredRole="candidate">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">AI Interview</h1>
            <p className="text-muted-foreground">Round 2: Live Technical Interview</p>
          </div>

          {/* Progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Interview Progress</CardTitle>
                {!interviewStarted ? (
                  <Badge variant="secondary">Not Started</Badge>
                ) : isComplete ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                ) : (
                  <Badge>Question {currentQuestion}/10</Badge>
                )}
              </div>
              <CardDescription>
                {isComplete 
                  ? 'Interview finished! Your responses are being evaluated...'
                  : 'Answer all 10 questions to complete the interview'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Start Interview Button */}
          {!interviewStarted && (
            <Card>
              <CardHeader>
                <CardTitle>Ready to Begin?</CardTitle>
                <CardDescription>
                  The AI interviewer will ask you 10 questions based on the job description and your resume.
                  You can answer using voice or text.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={startInterview} size="lg" className="w-full">
                  Start Interview
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Split Layout: Chat + Transcript */}
          {interviewStarted && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Chat Interface (2/3 width) */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Conversation</CardTitle>
                  <CardDescription>Answer using voice or text</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
                    <div className="space-y-4">
                      {messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-4 ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {msg.role === 'ai' && <Volume2 className="h-4 w-4" />}
                              <span className="text-xs opacity-75">
                                {msg.role === 'ai' ? 'AI Interviewer' : 'You'}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      {isProcessing && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-4">
                            <Spinner className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input Controls */}
                  {!isComplete && (
                    <div className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendText()}
                          placeholder="Type your answer..."
                          className="flex-1 px-4 py-2 border rounded-md"
                          disabled={isProcessing}
                        />
                        <Button
                          onClick={sendText}
                          disabled={!textInput.trim() || isProcessing}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isProcessing}
                          variant={isRecording ? 'destructive' : 'outline'}
                          size="lg"
                          className="w-full"
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="mr-2 h-5 w-5" />
                              Stop Recording
                            </>
                          ) : (
                            <>
                              <Mic className="mr-2 h-5 w-5" />
                              Record Answer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Completion Message */}
                  {isComplete && finalScore !== null && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg text-center border-2 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                      <h3 className="text-3xl font-bold mb-3">🎉 Interview Complete!</h3>
                      <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                        {finalScore}/100
                      </div>
                      <p className="text-base text-muted-foreground font-medium mb-2">
                        Your final score (30% resume + 70% interview)
                      </p>
                      <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-md">
                        <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                          ✓ Interview evaluation completed successfully
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Redirecting to detailed results in 3 seconds...
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Live Transcript (1/3 width) */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    Live Transcript
                  </CardTitle>
                  <CardDescription>Real-time conversation log</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-3">
                    <div className="space-y-3 text-sm">
                      {messages.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Transcript will appear here once interview starts...
                        </p>
                      ) : (
                        messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-md ${
                              msg.role === 'ai' 
                                ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500' 
                                : 'bg-green-50 dark:bg-green-950 border-l-4 border-green-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-xs uppercase">
                                {msg.role === 'ai' ? '🤖 AI' : '👤 You'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">
                              {msg.text}
                            </p>
                          </div>
                        ))
                      )}
                      {isProcessing && (
                        <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-800 border-l-4 border-gray-400">
                          <div className="flex items-center gap-2">
                            <Spinner className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">Processing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Transcript Stats */}
                  {messages.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                          <div className="font-bold text-blue-600 dark:text-blue-400">
                            {messages.filter(m => m.role === 'ai').length}
                          </div>
                          <div className="text-muted-foreground">AI Messages</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                          <div className="font-bold text-green-600 dark:text-green-400">
                            {messages.filter(m => m.role === 'user').length}
                          </div>
                          <div className="text-muted-foreground">Your Responses</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
