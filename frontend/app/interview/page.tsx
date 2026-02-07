'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    role: 'ai' | 'user';
    content: string;
}

interface Evaluation {
    personality_score: number;
    technical_approach_score: number;
    communication_score: number;
    problem_solving_score: number;
    interview_score: number;
    overall_assessment: string;
    hire_recommendation: string;
}

export default function InterviewPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [showSetup, setShowSetup] = useState(true);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [candidateName, setCandidateName] = useState('Candidate');
    const [jobDescription, setJobDescription] = useState(`Senior Software Engineer

We are looking for an experienced engineer with:
- 5+ years of Python development
- Experience with REST APIs and microservices
- Strong problem-solving skills
- Excellent communication abilities`);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newSocket = io('http://localhost:5000');

        newSocket.on('connect', () => setConnected(true));
        newSocket.on('disconnect', () => setConnected(false));

        newSocket.on('ai_response', (data) => {
            setMessages(prev => [...prev, { role: 'ai', content: data.text }]);
            setStatus('speaking');

            if (data.audio) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
                audio.onended = () => {
                    if (!data.is_complete) setStatus('idle');
                };
                audio.play().catch(() => setStatus('idle'));
            } else {
                setTimeout(() => setStatus('idle'), 1000);
            }
        });

        newSocket.on('user_transcript', (data) => {
            setMessages(prev => [...prev, { role: 'user', content: data.text }]);
        });

        newSocket.on('interview_evaluation', (data) => {
            setEvaluation(data.evaluation);
        });

        newSocket.on('error', (data) => {
            console.error('Error:', data.message);
            setStatus('idle');
        });

        setSocket(newSocket);
        return () => { newSocket.disconnect(); };
    }, []);

    useEffect(() => {
        chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
    }, [messages]);

    const startInterview = () => {
        if (!socket) return;
        setShowSetup(false);
        setMessages([]);
        socket.emit('start_interview', {
            name: candidateName,
            jd_text: jobDescription,
            max_questions: 5
        });
        setStatus('processing');
    };

    const startRecording = async () => {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    socket?.emit('user_audio', { audio: base64 });
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            setStatus('listening');
        } catch (err) {
            alert('Please allow microphone access');
        }
    };

    const stopRecording = () => {
        if (!isRecording || !mediaRecorderRef.current) return;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setStatus('processing');
    };

    const endInterview = () => {
        socket?.emit('end_interview');
    };

    const getStatusStyle = () => {
        switch (status) {
            case 'listening': return 'bg-red-500/20 text-red-400 animate-pulse-fast';
            case 'processing': return 'bg-amber-500/20 text-amber-400';
            case 'speaking': return 'bg-primary/20 text-primary-light';
            default: return 'bg-slate-700 text-slate-400';
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold gradient-text mb-2">🎤 AI Live Interview</h1>
                <p className="text-slate-400">Model 2: Real-time Interview Evaluation</p>
            </div>

            {/* Status Bar */}
            <div className="flex justify-center gap-4 mb-6">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold uppercase ${getStatusStyle()}`}>
                    {status === 'listening' ? '🔴 Listening' :
                        status === 'processing' ? '⏳ Processing' :
                            status === 'speaking' ? '🔊 AI Speaking' : 'Ready'}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {connected ? '🟢 Connected' : '🔴 Disconnected'}
                </span>
            </div>

            {/* Setup Panel */}
            {showSetup && (
                <div className="card p-6 mb-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Candidate Name</label>
                            <input
                                type="text"
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Job Description</label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white h-32"
                            />
                        </div>
                        <button
                            onClick={startInterview}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        >
                            🚀 Start Interview
                        </button>
                    </div>
                </div>
            )}

            {/* Chat */}
            {!showSetup && (
                <>
                    <div ref={chatRef} className="card p-4 h-96 overflow-y-auto mb-6">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                Interview will appear here...
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`mb-4 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <span className="text-xs text-slate-500 mb-1">
                                        {msg.role === 'ai' ? '🤖 AI Interviewer' : '👤 You'}
                                    </span>
                                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.role === 'ai'
                                            ? 'bg-gradient-to-r from-primary to-primary-dark rounded-bl-sm'
                                            : 'bg-slate-700 border border-slate-600 rounded-br-sm'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
                        <button
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            disabled={status !== 'idle'}
                            className={`px-8 py-4 rounded-full font-bold text-lg ${status === 'idle'
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90'
                                    : 'bg-slate-600 cursor-not-allowed'
                                } ${isRecording ? 'animate-pulse-fast' : ''}`}
                        >
                            {isRecording ? '🔴 Recording...' : '🎙️ Hold to Speak'}
                        </button>
                        <button
                            onClick={endInterview}
                            className="px-6 py-4 rounded-full bg-slate-700 border border-slate-600 hover:bg-slate-600 transition-colors"
                        >
                            ⏹️ End
                        </button>
                    </div>
                </>
            )}

            {/* Evaluation */}
            {evaluation && (
                <div className="card p-6 mt-6 border-emerald-500/50">
                    <h3 className="text-xl font-bold mb-4">📊 Interview Evaluation</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-slate-800 rounded-lg">
                            <div className="text-3xl font-bold text-emerald-400">{evaluation.personality_score}</div>
                            <div className="text-sm text-slate-400">Personality</div>
                        </div>
                        <div className="text-center p-4 bg-slate-800 rounded-lg">
                            <div className="text-3xl font-bold text-primary-light">{evaluation.technical_approach_score}</div>
                            <div className="text-sm text-slate-400">Technical</div>
                        </div>
                        <div className="text-center p-4 bg-slate-800 rounded-lg">
                            <div className="text-3xl font-bold text-amber-400">{evaluation.communication_score}</div>
                            <div className="text-sm text-slate-400">Communication</div>
                        </div>
                        <div className="text-center p-4 bg-slate-800 rounded-lg">
                            <div className="text-3xl font-bold text-white">{evaluation.interview_score}</div>
                            <div className="text-sm text-slate-400">Round 2 Score</div>
                        </div>
                    </div>
                    <p className="mt-4 text-slate-300">{evaluation.overall_assessment}</p>
                </div>
            )}
        </div>
    );
}
