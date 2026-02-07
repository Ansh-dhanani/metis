# METIS Live Interview - Frontend Implementation (Next.js)

> **Goal:** Create a modern interface for the AI Interview with microphone capture and audio playback.

---

## 📦 Dependencies

```bash
npx create-next-app@latest metis-frontend
cd metis-frontend
npm install socket.io-client react-audio-recorder
```

## 🧩 Component: `LiveInterview.js`

```jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Flask URL

export default function LiveInterview() {
  const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // START INTERVIEW
    socket.emit('start_interview', {
      jd_text: "Senior Python Developer...", 
      name: "Ansh"
    });

    // HANDLERS
    socket.on('ai_response', (data) => {
      setStatus('speaking');
      
      // Add text to chat
      setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
      
      // Play Audio
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audio.play();
      
      audio.onended = () => {
        setStatus('idle');
      };
    });

    socket.on('user_transcript', (data) => {
      setMessages(prev => [...prev, { role: 'user', text: data.text }]);
    });
    
    return () => socket.disconnect();
  }, []);

  const startRecording = async () => {
    setStatus('listening');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];
      
      // Convert Blob to Base64 and send
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        setStatus('processing');
        socket.emit('user_audio', { audio: base64Audio });
      };
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Metis AI Interview</h1>
      
      {/* STATUS INDICATOR */}
      <div className={`mb-4 p-2 rounded text-center ${
        status === 'listening' ? 'bg-red-100 text-red-800' :
        status === 'speaking' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100'
      }`}>
        Status: {status.toUpperCase()}
      </div>

      {/* CHAT LOG */}
      <div className="h-96 overflow-y-auto border rounded p-4 mb-4 bg-white">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
            }`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {/* CONTROLS */}
      <div className="flex justify-center">
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          disabled={status !== 'idle'}
          className={`px-6 py-3 rounded-full font-bold ${
            status === 'idle' 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Hold to Speak 🎙️
        </button>
      </div>
    </div>
  );
}
```

## 🎨 Styling (Tailwind CSS)

Ensure `globals.css` imports Tailwind. The component uses basic utility classes for layout and visual feedback.

---

## 🔄 Data Flow

1. **User holds button**: Records audio (WebM)
2. **Release button**: Sends Base64 audio to Flask via Socket.IO
3. **Wait for 'processing'**: Server transcribes + LLM + TTS
4. **Receive 'ai_response'**: Frontend plays audio, shows text
5. **Cycle repeats** until interview ends
