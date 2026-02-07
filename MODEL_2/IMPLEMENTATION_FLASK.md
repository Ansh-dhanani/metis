# METIS Live Interview - Backend Implementation (Flask)

> **Goal:** Expose Model 2 (AI Interviewer) as a WebSocket API for real-time capabilities.

---

## 🏗️ Architecture

```
Client (Next.js) <──[WebSocket]──> Flask Server <──> Groq API (STT/LLM)
```

## 📦 Dependencies

```bash
pip install flask flask-socketio eventlet gtts groq
```

## 🚀 Implementation Code

Create `app.py`:

```python
from flask import Flask, request
from flask_socketio import SocketIO, emit
from metis.interviewer_ai import LiveInterviewer
from metis.transcriber import transcribe_audio
from metis.tts import speak_async
import os
import base64
import tempfile

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store active interview sessions
sessions = {}

@socketio.on('start_interview')
def handle_start(data):
    """Initialize interview session"""
    session_id = request.sid
    jd_text = data.get('jd_text')
    candidate_name = data.get('name', 'Candidate')
    
    # Create interviewer instance
    interviewer = LiveInterviewer(
        job_description=jd_text,
        candidate_name=candidate_name
    )
    sessions[session_id] = interviewer
    
    # Get opening question
    opening = interviewer.get_opening()
    
    # Generate audio for opening
    audio_path = speak_async(opening)
    
    # Send text and audio to client
    with open(audio_path, "rb") as f:
        audio_data = base64.b64encode(f.read()).decode('utf-8')
        
    emit('ai_response', {
        'text': opening,
        'audio': audio_data
    })
    
    # Cleanup temp file
    os.unlink(audio_path)

@socketio.on('user_audio')
def handle_audio(data):
    """Handle candidate audio chunk"""
    session_id = request.sid
    if session_id not in sessions:
        return
        
    interviewer = sessions[session_id]
    audio_blob = data.get('audio') # Base64 encoded wav/webm
    
    # 1. Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as fp:
        fp.write(base64.b64decode(audio_blob))
        temp_path = fp.name
        
    # 2. Transcribe (Speech-to-Text)
    transcript_res = transcribe_audio(temp_path)
    user_text = transcript_res.get('text', '')
    os.unlink(temp_path)
    
    emit('user_transcript', {'text': user_text})
    
    # 3. Get AI Response (LLM)
    ai_text = interviewer.respond_to_candidate(user_text)
    
    # 4. Generate Speech (Text-to-Speech)
    audio_path = speak_async(ai_text)
    
    with open(audio_path, "rb") as f:
        audio_data = base64.b64encode(f.read()).decode('utf-8')
    os.unlink(audio_path)
    
    # 5. Send back to client
    emit('ai_response', {
        'text': ai_text,
        'audio': audio_data,
        'is_complete': interviewer.is_complete
    })

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
```

## 🔑 Key Features
1. **WebSocket Protocol**: Low latency communication
2. **Session Management**: Tracks context per user
3. **Binary Handling**: Base64 encoding for audio transfer
4. **Async Processing**: STT -> LLM -> TTS pipeline

---

## 🏃 Run the Server

```bash
python app.py
```
