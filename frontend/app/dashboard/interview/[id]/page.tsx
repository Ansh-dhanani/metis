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
  // Track live socket connection & server-confirmed session state
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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

  const connectSocket = () => {
    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    setConnectionError(null);
    setIsConnected(false);

    const newSocket = io(config.wsUrl, {
      reconnectionDelayMax: 10000,
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 5,
      forceNew: true,
      transports: ['websocket', 'polling'], // fallback to polling if WS fails
      timeout: 20000,
    });

    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
      setConnectionError('Could not connect to interview server. Please retry.');
      toast.error('Connection error. Click "Retry Connection" to try again.');
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnect attempt #${attempt}...`);
    });

    newSocket.on('reconnect_failed', () => {
      setConnectionError('Could not reconnect after multiple attempts. Please retry.');
      toast.error('Connection failed. Please click "Retry Connection".');
    });

    // Server confirmed the interview session is active
    newSocket.on('session_started', (data: any) => {
      console.log('✅ Interview session started on server:', data);
      setIsSessionReady(true); // Only allow sending answers once server confirms
      toast.success('Interview session ready! The AI is preparing your first question...');
    });

    // AI text response — arrives immediately
    newSocket.on('ai_response', (data: any) => {
      console.log('📝 AI Response received:', data.questionNumber);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.text,
        audio: data.audio,
        timestamp: new Date()
      }]);

      setCurrentQuestion(data.questionNumber || 0);
      setIsProcessing(false);

      // Play audio if it came bundled (fallback for when async audio is disabled)
      if (data.audio) {
        playAudio(data.audio);
      }

      // Check if interview is complete
      if (data.isComplete) {
        handleInterviewComplete();
      }
    });

    // Listen for transcriptions (primarily for AUDIO mode)
    // For text mode, messages are added optimistically in sendText()
    newSocket.on('user_transcript', (data: any) => {
      if (!data.text) return;
      console.log('📢 User transcript received:', data.text.substring(0, 50));
      setMessages(prev => {
        // Skip if the last message is already this exact text (text-mode optimistic render)
        const last = prev[prev.length - 1];
        if (last && last.role === 'user' && last.text === data.text) {
          return prev; // already shown
        }
        return [...prev, {
          role: 'user',
          text: data.text,
          timestamp: new Date()
        }];
      });
    });

    newSocket.on('error', (error: any) => {
      console.error('❌ Interview error:', error);
      const errorMsg = typeof error === 'string' ? error : (error.message || 'Interview error occurred');
      toast.error(errorMsg || 'Interview error occurred');
      setIsProcessing(false);
    });

    newSocket.on('disconnect', (reason: any) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
      setIsSessionReady(false); // Reset so we re-confirm session on reconnect
      if (reason !== 'io client namespace disconnect') {
        toast.warning('Connection lost. Attempting to reconnect...');
      }
    });
  };

  useEffect(() => {
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startInterview = async () => {
    if (!socketRef.current) return;
    if (interviewStarted) {
      toast.warning('Interview already started. Please wait for the current session.');
      return;
    }

    try {
      // Check if interview service is available
      const statusCheck = await fetch(`${config.apiUrl}/api/live-interview/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }).catch(err => {
        console.warn('Could not check interview status:', err);
        return null;
      });

      if (statusCheck && statusCheck.ok) {
        const status = await statusCheck.json();
        console.log('Interview service status:', status);
        if (!status.interview_service_available) {
          toast.error('Interview service is unavailable. Please try again later or contact support.');
          return;
        }
      }

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

      // Validate API responses before parsing
      if (!jobResponse.ok) {
        toast.error(`Could not load job details (${jobResponse.status}). Please go back and try again.`);
        return;
      }
      if (!appResponse.ok) {
        toast.error(`Could not load application data (${appResponse.status}). Please go back and try again.`);
        return;
      }

      const job = await jobResponse.json();
      const application = await appResponse.json();

      if (!job.description) {
        toast.error('Job description is missing. Cannot start interview without it.');
        return;
      }

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

      // Log the data being sent for debugging
      console.log('Starting interview with:', {
        jobId,
        applicationId,
        candidateId: user?.userId,
        socketConnected: socketRef.current?.connected,
        socketId: socketRef.current?.id
      });

      // Start interview via WebSocket with full context
      socketRef.current?.emit('start_interview', {
        jobId,
        applicationId,  // IMPORTANT: Include applicationId
        candidateId: user?.userId,
        candidateName: `${user?.firstName} ${user?.lastName}`,
        jdText: job.description,
        candidateContext // Pass parsed resume data for contextual questions
      });

      setInterviewStarted(true);
      toast.success('Interview started! AI will ask 10 contextual questions based on your resume.');
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview. Check console for details.');
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

    // Guard: ensure server-side session is active before sending
    if (!isSessionReady) {
      toast.error('Interview session is not ready yet. Please wait for the AI to ask the first question.');
      setIsProcessing(false);
      return;
    }

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

    // Guard: ensure server-side session is active before sending
    if (!isSessionReady) {
      toast.error('Interview session is not ready yet. Please wait for the AI to ask the first question.');
      return;
    }

    const trimmedText = textInput.trim();
    
    // Immediately show the user's message in the chat (optimistic render)
    setMessages(prev => [...prev, {
      role: 'user',
      text: trimmedText,
      timestamp: new Date()
    }]);
    
    setIsProcessing(true);
    setTextInput('');
    socketRef.current?.emit('send_text', { text: trimmedText });
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
            <>
              {/* Connection Status */}
              <Card className={`border-2 ${
                connectionError 
                  ? 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800'
                  : isConnected
                  ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'
                  : 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        connectionError ? 'bg-red-500' : isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'
                      }`}></span>
                      <span>
                        {connectionError
                          ? `❌ ${connectionError}`
                          : isConnected
                          ? '✅ Ready to start'
                          : '⏳ Connecting to interview server... Please wait'}
                      </span>
                    </div>
                    {/* Only show Retry button after a confirmed failure, not during initial connect */}
                    {connectionError && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={connectSocket}
                      >
                        🔄 Retry Connection
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ready to Begin?</CardTitle>
                  <CardDescription>
                    The AI interviewer will ask you 10 questions based on the job description and your resume.
                    You can answer using voice or text.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={startInterview}
                    size="lg"
                    className="w-full"
                    disabled={!isConnected}
                  >
                    {isConnected ? 'Start Interview' : 'Connecting...'}
                  </Button>
                </CardContent>
              </Card>
            </>
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
                      {/* Session not yet confirmed by server */}
                      {!isSessionReady && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
                          <Spinner className="h-4 w-4" />
                          <span>Waiting for AI interviewer to start the session... Please wait.</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendText()}
                          placeholder={isSessionReady ? 'Type your answer...' : 'Waiting for session...'}
                          className="flex-1 px-4 py-2 border rounded-md disabled:opacity-50"
                          disabled={isProcessing || !isSessionReady}
                        />
                        <Button
                          onClick={sendText}
                          disabled={!textInput.trim() || isProcessing || !isSessionReady}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isProcessing || !isSessionReady}
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
