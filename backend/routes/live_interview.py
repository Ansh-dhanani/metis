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
    print(f"[WARN] Interview models not available: {e}")
    INTERVIEW_AVAILABLE = False

live_interview_bp = Blueprint('live_interview', __name__)

# Store active interview sessions
# Format: {session_id: {interviewer: LiveInterviewer, job_id: str, candidate_id: str}}
active_sessions = {}


def get_db():
    """Get database instance."""
    from app import db
    return db




# REST endpoints for diagnostics
@live_interview_bp.route('/status', methods=['GET'])
def interview_status():
    """Check if interview service is available."""
    from flask import jsonify
    
    return jsonify({
        'status': 'available' if INTERVIEW_AVAILABLE else 'unavailable',
        'interview_service_available': INTERVIEW_AVAILABLE,
        'active_sessions': len(active_sessions),
        'active_session_ids': list(active_sessions.keys()),
        'socketio_available': True
    })


def init_socketio(socketio):
    """Initialize SocketIO event handlers."""
    
    @socketio.on('start_interview')
    def handle_start_interview(data):
        """
        Start a new interview session.
        
        Data:
            {
                "jobId": "...",
                "applicationId": "...",
                "candidateId": "...",
                "candidateName": "...",
                "jdText": "Job description...",
                "candidateContext": "Resume highlights..." (optional)
            }
        """
        if not INTERVIEW_AVAILABLE:
            print("[WARN] INTERVIEW_AVAILABLE is False - models not loaded")
            emit('error', {'message': 'Interview service unavailable. Please contact support.'})
            return
        
        try:
            session_id = request.sid
            job_id = data.get('jobId')
            application_id = data.get('applicationId')
            candidate_id = data.get('candidateId')
            candidate_name = data.get('candidateName', 'Candidate')
            jd_text = data.get('jdText', '')
            candidate_context = data.get('candidateContext', '')
            
            print(f"[INTERVIEW] Starting session {session_id} for candidate {candidate_id}")
            
            # Create interviewer instance
            interviewer = LiveInterviewer(
                job_description=jd_text,
                candidate_name=candidate_name,
                candidate_context=candidate_context
            )
            
            # Store session with applicationId for database queries
            active_sessions[session_id] = {
                'interviewer': interviewer,
                'job_id': job_id,
                'application_id': application_id,
                'candidate_id': candidate_id,
                'started_at': datetime.now(),
                'messages': [],
                'last_activity': datetime.now()  # Track for timeout
            }
            
            print(f"[INTERVIEW] Session {session_id} created and stored")
            
            # Confirm session IMMEDIATELY -- frontend needs this to unlock inputs
            emit('session_started', {'sessionId': session_id, 'message': 'Interview started'})
            
            # Get opening question
            opening = interviewer.get_opening()
            
            # Store message
            active_sessions[session_id]['messages'].append({
                'role': 'ai',
                'text': opening,
                'timestamp': datetime.now()
            })
            
            print(f"[INTERVIEW] Sending opening question to client")
            
            # Generate audio (non-fatal: if it fails, send text-only)
            audio_data = None
            try:
                audio_path = speak_async(opening)
                if audio_path:
                    with open(audio_path, "rb") as f:
                        audio_data = base64.b64encode(f.read()).decode('utf-8')
                    os.unlink(audio_path)
            except Exception as audio_err:
                print(f"[WARN] Audio generation failed (text-only fallback): {audio_err}")
            
            # Send to client
            emit('ai_response', {
                'text': opening,
                'audio': audio_data,
                'questionNumber': 1,
                'isComplete': False,
                'sessionId': session_id
            })
            
        except Exception as e:
            print(f"[ERROR] Error starting interview: {str(e)}")
            import traceback
            traceback.print_exc()
            emit('error', {'message': f'Failed to start interview: {str(e)}'})
    
    
    
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
                print(f"[ERROR] Session {session_id} not found in active_sessions")
                print(f"  Active sessions: {list(active_sessions.keys())}")
                emit('error', {
                    'message': 'No active interview session. The session may have expired or the server restarted. Please refresh the page and start a new interview.',
                    'code': 'SESSION_NOT_FOUND'
                })
                return
            
            session = active_sessions[session_id]
            session['last_activity'] = datetime.now()  # Update activity timestamp
            interviewer = session['interviewer']
            audio_blob = data.get('audio')
            
            if not audio_blob:
                emit('error', {'message': 'No audio data received'})
                return
            
            print(f"[INTERVIEW] Processing audio for session {session_id}...")
            
            # Save audio to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as fp:
                fp.write(base64.b64decode(audio_blob))
                temp_path = fp.name
            
            # Transcribe audio
            transcript_res = transcribe_audio(temp_path)
            user_text = transcript_res.get('text', '')
            os.unlink(temp_path)
            
            print(f"  Transcribed: {user_text[:100]}")
            
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
            
            # Store AI message
            session['messages'].append({
                'role': 'ai',
                'text': ai_text,
                'timestamp': datetime.now()
            })
            
            print(f"  Q{interviewer.question_count}/10 - Interview complete: {interviewer.is_complete}")
            
            # Send response (with optional audio)
            audio_data = None
            try:
                audio_path = speak_async(ai_text)
                if audio_path:
                    with open(audio_path, "rb") as f:
                        audio_data = base64.b64encode(f.read()).decode('utf-8')
                    os.unlink(audio_path)
            except Exception as audio_err:
                print(f"[WARN] Audio generation failed (text-only fallback): {audio_err}")
            
            emit('ai_response', {
                'text': ai_text,
                'audio': audio_data,
                'questionNumber': interviewer.question_count,
                'isComplete': interviewer.is_complete
            })
            
            # If interview complete, save to database
            if interviewer.is_complete:
                print(f"[INTERVIEW] Interview complete for session {session_id}, saving...")
                save_interview_data(session)
                
        except Exception as e:
            print(f"[ERROR] Error handling audio: {str(e)}")
            import traceback
            traceback.print_exc()
            emit('error', {'message': f'Error processing audio: {str(e)}'})
    
    
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
                print(f"[ERROR] Text handler: Session {session_id} not found in active_sessions")
                print(f"  Active sessions: {list(active_sessions.keys())}")
                emit('error', {
                    'message': 'No active interview session. The session may have expired or the server restarted. Please refresh the page and start a new interview.',
                    'code': 'SESSION_NOT_FOUND'
                })
                return
            
            session = active_sessions[session_id]
            session['last_activity'] = datetime.now()
            interviewer = session['interviewer']
            user_text = data.get('text', '').strip()
            
            if not user_text:
                emit('error', {'message': 'No text received'})
                return
            
            print(f"[INTERVIEW] Text input for session {session_id}: {user_text[:100]}")
            
            # Echo user message back to client (consistent with audio path)
            emit('user_transcript', {'text': user_text})
            
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
            
            print(f"  Q{interviewer.question_count}/10 - Interview complete: {interviewer.is_complete}")
            
            # Send response (with optional audio)
            audio_data = None
            try:
                audio_path = speak_async(ai_text)
                if audio_path:
                    with open(audio_path, "rb") as f:
                        audio_data = base64.b64encode(f.read()).decode('utf-8')
                    os.unlink(audio_path)
            except Exception as audio_err:
                print(f"[WARN] Audio generation failed (text-only fallback): {audio_err}")
            
            emit('ai_response', {
                'text': ai_text,
                'audio': audio_data,
                'questionNumber': interviewer.question_count,
                'isComplete': interviewer.is_complete
            })
            
            # If interview complete, save to database
            if interviewer.is_complete:
                print(f"[INTERVIEW] Interview complete (text mode) for session {session_id}, saving...")
                save_interview_data(session)
                
        except Exception as e:
            print(f"[ERROR] Error handling text: {str(e)}")
            import traceback
            traceback.print_exc()
            emit('error', {'message': f'Error processing response: {str(e)}'})
    
    
    @socketio.on('end_interview')
    def handle_end_interview():
        """End interview session and save data."""
        try:
            session_id = request.sid
            print(f"[INTERVIEW] End interview requested for session {session_id}")
            
            if session_id in active_sessions:
                session = active_sessions[session_id]
                print(f"  Saving session data...")
                save_interview_data(session)
                del active_sessions[session_id]
                print(f"  Session cleaned up")
            else:
                print(f"  Session not found, nothing to save")
                
            emit('interview_ended', {'message': 'Interview saved successfully'})
            
        except Exception as e:
            print(f"[ERROR] Error ending interview: {str(e)}")
            import traceback
            traceback.print_exc()
            emit('error', {'message': f'Error ending interview: {str(e)}'})
    
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Clean up on disconnect."""
        session_id = request.sid
        print(f"[SOCKETIO] Client disconnected: {session_id}")
        if session_id in active_sessions:
            # Auto-save on disconnect
            print(f"  Saving interview data before cleanup...")
            session = active_sessions[session_id]
            save_interview_data(session)
            del active_sessions[session_id]
            print(f"  Session cleaned up")
        else:
            print(f"  No active session to clean up")


def save_interview_data(session):
    """Save interview transcript and data to database."""
    try:
        db = get_db()
        if db is None:
            print("[ERROR] Cannot save interview: database not connected")
            return
        
        # Store all IDs as strings for consistent querying.
        # The evaluation route uses $or to handle both string and ObjectId forms.
        application_id = session.get('application_id')
        interview_data = {
            'jobId': str(session['job_id']) if session.get('job_id') else None,
            'applicationId': str(application_id) if application_id else None,
            'candidateId': str(session['candidate_id']) if session.get('candidate_id') else None,
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
        result = db.interviews.insert_one(interview_data)
        print(f"[DB] Interview saved with ID: {result.inserted_id}")
        
        # Update application status using applicationId
        if application_id and ObjectId.is_valid(str(application_id)):
            app_result = db.applications.update_one(
                {'_id': ObjectId(str(application_id))},
                {
                    '$set': {
                        'hasInterview': True,
                        'interviewStatus': interview_data['status'],
                        'interviewedAt': datetime.now()
                    }
                }
            )
            print(f"[DB] Application updated: {app_result.modified_count} document(s)")
        elif session.get('job_id') and session.get('candidate_id'):
            # Fallback to job_id + candidate_id if applicationId is not available
            app_result = db.applications.update_one(
                {
                    'jobId': ObjectId(str(session['job_id'])) if ObjectId.is_valid(str(session['job_id'])) else session['job_id'],
                    'candidateId': ObjectId(str(session['candidate_id'])) if ObjectId.is_valid(str(session['candidate_id'])) else session['candidate_id']
                },
                {
                    '$set': {
                        'hasInterview': True,
                        'interviewStatus': interview_data['status'],
                        'interviewedAt': datetime.now()
                    }
                }
            )
            print(f"[DB] Application updated (fallback query): {app_result.modified_count} document(s)")
        
    except Exception as e:
        print(f"[ERROR] Error saving interview data: {e}")
        import traceback
        traceback.print_exc()
