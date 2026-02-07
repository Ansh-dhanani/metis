"""
Live Interview Routes (WebSocket)

Integrates Model 2 (AI Interviewer) for real-time interviews.
Uses Flask-SocketIO for WebSocket communication.
"""

from flask import Blueprint, request
from flask_socketio import emit, join_room, leave_room
import sys
import os
import base64
import tempfile
from datetime import datetime
from bson import ObjectId

# Add models to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

try:
    from metis.interviewer_ai import LiveInterviewer
    from metis.transcriber import transcribe_audio
    from metis.tts import speak_async
    INTERVIEW_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Interview models not available: {e}")
    INTERVIEW_AVAILABLE = False

live_interview_bp = Blueprint('live_interview', __name__)

# Store active interview sessions
# Format: {session_id: {interviewer: LiveInterviewer, job_id: str, candidate_id: str}}
active_sessions = {}


def get_db():
    """Get database instance."""
    from app import db
    return db


def init_socketio(socketio):
    """Initialize SocketIO event handlers."""
    
    @socketio.on('start_interview')
    def handle_start_interview(data):
        """
        Start a new interview session.
        
        Data:
            {
                "jobId": "...",
                "candidateId": "...",
                "candidateName": "...",
                "jdText": "Job description...",
                "candidateContext": "Resume highlights..." (optional)
            }
        """
        if not INTERVIEW_AVAILABLE:
            emit('error', {'message': 'Interview service unavailable'})
            return
        
        try:
            session_id = request.sid
            job_id = data.get('jobId')
            candidate_id = data.get('candidateId')
            candidate_name = data.get('candidateName', 'Candidate')
            jd_text = data.get('jdText', '')
            candidate_context = data.get('candidateContext', '')
            
            # Create interviewer instance
            interviewer = LiveInterviewer(
                job_description=jd_text,
                candidate_name=candidate_name,
                candidate_context=candidate_context
            )
            
            # Store session
            active_sessions[session_id] = {
                'interviewer': interviewer,
                'job_id': job_id,
                'candidate_id': candidate_id,
                'started_at': datetime.now(),
                'messages': []
            }
            
            # Get opening question
            opening = interviewer.get_opening()
            
            # Generate audio
            audio_path = speak_async(opening)
            
            with open(audio_path, "rb") as f:
                audio_data = base64.b64encode(f.read()).decode('utf-8')
            
            # Cleanup temp file
            os.unlink(audio_path)
            
            # Store message
            active_sessions[session_id]['messages'].append({
                'role': 'ai',
                'text': opening,
                'timestamp': datetime.now()
            })
            
            # Send to client
            emit('ai_response', {
                'text': opening,
                'audio': audio_data,
                'questionNumber': 1,
                'isComplete': False
            })
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    
    @socketio.on('send_audio')
    def handle_audio(data):
        """
        Handle candidate audio response.
        
        Data:
            {
                "audio": "base64_encoded_audio_blob"
            }
        """
        if not INTERVIEW_AVAILABLE:
            emit('error', {'message': 'Interview service unavailable'})
            return
        
        try:
            session_id = request.sid
            
            if session_id not in active_sessions:
                emit('error', {'message': 'No active interview session'})
                return
            
            session = active_sessions[session_id]
            interviewer = session['interviewer']
            audio_blob = data.get('audio')
            
            if not audio_blob:
                emit('error', {'message': 'No audio data received'})
                return
            
            # Save audio to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as fp:
                fp.write(base64.b64decode(audio_blob))
                temp_path = fp.name
            
            # Transcribe audio
            transcript_res = transcribe_audio(temp_path)
            user_text = transcript_res.get('text', '')
            os.unlink(temp_path)
            
            # Send transcript to client
            emit('user_transcript', {'text': user_text})
            
            # Store candidate message
            session['messages'].append({
                'role': 'candidate',
                'text': user_text,
                'timestamp': datetime.now()
            })
            
            # Get AI response
            ai_text = interviewer.respond_to_candidate(user_text)
            
            # Generate audio
            audio_path = speak_async(ai_text)
            
            with open(audio_path, "rb") as f:
                audio_data = base64.b64encode(f.read()).decode('utf-8')
            os.unlink(audio_path)
            
            # Store AI message
            session['messages'].append({
                'role': 'ai',
                'text': ai_text,
                'timestamp': datetime.now()
            })
            
            # Send response
            emit('ai_response', {
                'text': ai_text,
                'audio': audio_data,
                'questionNumber': interviewer.question_count,
                'isComplete': interviewer.is_complete
            })
            
            # If interview complete, save to database
            if interviewer.is_complete:
                save_interview_data(session)
                
        except Exception as e:
            emit('error', {'message': str(e)})
    
    
    @socketio.on('send_text')
    def handle_text(data):
        """
        Handle candidate text response (for text-only mode).
        
        Data:
            {
                "text": "candidate response..."
            }
        """
        if not INTERVIEW_AVAILABLE:
            emit('error', {'message': 'Interview service unavailable'})
            return
        
        try:
            session_id = request.sid
            
            if session_id not in active_sessions:
                emit('error', {'message': 'No active interview session'})
                return
            
            session = active_sessions[session_id]
            interviewer = session['interviewer']
            user_text = data.get('text', '')
            
            # Store candidate message
            session['messages'].append({
                'role': 'candidate',
                'text': user_text,
                'timestamp': datetime.now()
            })
            
            # Get AI response
            ai_text = interviewer.respond_to_candidate(user_text)
            
            # Store AI message
            session['messages'].append({
                'role': 'ai',
                'text': ai_text,
                'timestamp': datetime.now()
            })
            
            # Send response (no audio in text mode)
            emit('ai_response', {
                'text': ai_text,
                'questionNumber': interviewer.question_count,
                'isComplete': interviewer.is_complete
            })
            
            # If interview complete, save to database
            if interviewer.is_complete:
                save_interview_data(session)
                
        except Exception as e:
            emit('error', {'message': str(e)})
    
    
    @socketio.on('end_interview')
    def handle_end_interview():
        """End interview session and save data."""
        try:
            session_id = request.sid
            
            if session_id in active_sessions:
                session = active_sessions[session_id]
                save_interview_data(session)
                del active_sessions[session_id]
                
            emit('interview_ended', {'message': 'Interview saved successfully'})
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Clean up on disconnect."""
        session_id = request.sid
        if session_id in active_sessions:
            # Auto-save on disconnect
            session = active_sessions[session_id]
            save_interview_data(session)
            del active_sessions[session_id]


def save_interview_data(session):
    """Save interview transcript and data to database."""
    try:
        db = get_db()
        
        interview_data = {
            'jobId': session['job_id'],
            'candidateId': session['candidate_id'],
            'messages': [
                {
                    'role': msg['role'],
                    'text': msg['text'],
                    'timestamp': msg['timestamp']
                }
                for msg in session['messages']
            ],
            'startedAt': session['started_at'],
            'completedAt': datetime.now(),
            'questionCount': session['interviewer'].question_count,
            'status': 'completed' if session['interviewer'].is_complete else 'incomplete'
        }
        
        # Save to interviews collection
        db.interviews.insert_one(interview_data)
        
        # Update application status
        db.applications.update_one(
            {
                'jobId': session['job_id'],
                'candidateId': session['candidate_id']
            },
            {
                '$set': {
                    'hasInterview': True,
                    'interviewStatus': interview_data['status'],
                    'interviewedAt': datetime.now()
                }
            }
        )
        
    except Exception as e:
        print(f"Error saving interview data: {e}")
