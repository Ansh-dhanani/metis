"""
Interview Routes - WebSocket handlers for live AI interviews

Provides real-time interview functionality using Flask-SocketIO.
"""

import os
import sys
import base64
import tempfile
from flask import Blueprint, request, jsonify
from flask_socketio import emit

# Add hackathon path to allow imports
hackathon_path = os.path.join(os.path.dirname(__file__), '..', 'hackathon', 'hackathon')
if hackathon_path not in sys.path:
    sys.path.insert(0, hackathon_path)

try:
    from metis.interviewer_ai import LiveInterviewer
    from metis.transcriber import transcribe_from_bytes
    from metis.tts import get_audio_bytes
    from metis.interview_evaluator import evaluate_interview, get_round2_score
    MODEL2_AVAILABLE = True
except ImportError as e:
    MODEL2_AVAILABLE = False
    print(f"[Interview Routes] Model 2 imports failed: {e}")

# Blueprint for REST endpoints
interview_bp = Blueprint('interview', __name__, url_prefix='/api/interview')

# Store active interview sessions (in production, use Redis)
interview_sessions = {}


def register_socketio_handlers(socketio):
    """Register WebSocket event handlers with SocketIO instance."""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle new WebSocket connection."""
        print(f"[WebSocket] Client connected: {request.sid}")
        emit('connected', {'status': 'ready', 'model2_available': MODEL2_AVAILABLE})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle WebSocket disconnection."""
        session_id = request.sid
        if session_id in interview_sessions:
            del interview_sessions[session_id]
        print(f"[WebSocket] Client disconnected: {session_id}")
    
    @socketio.on('start_interview')
    def handle_start_interview(data):
        """
        Initialize a new interview session.
        
        Expected data:
            jd_text: Job description text
            name: Candidate name
            candidate_id: Optional candidate ID from Round 1
            max_questions: Optional max questions (default 10)
        """
        if not MODEL2_AVAILABLE:
            emit('error', {'message': 'Model 2 not available. Check server logs.'})
            return
        
        session_id = request.sid
        jd_text = data.get('jd_text', 'Software Developer position')
        candidate_name = data.get('name', 'Candidate')
        candidate_id = data.get('candidate_id', '')
        max_questions = data.get('max_questions', 10)
        
        # Get candidate context from profile if candidate_id provided
        candidate_context = ""
        if candidate_id:
            try:
                from metis.candidate_profile import get_profile
                profile = get_profile(candidate_id)
                if profile:
                    candidate_name = profile.name or candidate_name
                    candidate_context = profile.get_interview_context()
            except Exception as e:
                print(f"[Interview] Could not fetch profile: {e}")
        
        try:
            # Create interviewer instance with context
            interviewer = LiveInterviewer(
                job_description=jd_text,
                candidate_name=candidate_name,
                candidate_context=candidate_context,
                max_questions=max_questions
            )
            
            interview_sessions[session_id] = {
                'interviewer': interviewer,
                'jd_text': jd_text,
                'candidate_name': candidate_name,
                'candidate_id': candidate_id
            }
            
            # Get opening question
            opening = interviewer.get_opening()
            
            # Generate audio
            audio_bytes = get_audio_bytes(opening)
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ""
            
            emit('ai_response', {
                'text': opening,
                'audio': audio_b64,
                'question_number': 1,
                'is_complete': False
            })
            
        except Exception as e:
            emit('error', {'message': f'Failed to start interview: {str(e)}'})
    
    @socketio.on('user_audio')
    def handle_user_audio(data):
        """
        Handle candidate audio response.
        
        Expected data:
            audio: Base64 encoded audio (webm/wav)
        """
        session_id = request.sid
        
        if session_id not in interview_sessions:
            emit('error', {'message': 'No active interview session'})
            return
        
        session = interview_sessions[session_id]
        interviewer = session['interviewer']
        
        audio_b64 = data.get('audio', '')
        
        if not audio_b64:
            emit('error', {'message': 'No audio data received'})
            return
        
        try:
            # Decode audio
            audio_bytes = base64.b64decode(audio_b64)
            
            # Transcribe
            result = transcribe_from_bytes(audio_bytes, filename="audio.webm")
            user_text = result.get('text', '').strip()
            
            if not user_text:
                emit('user_transcript', {'text': '[Could not transcribe audio]'})
                return
            
            emit('user_transcript', {'text': user_text})
            
            # Get AI response
            ai_response = interviewer.respond_to_candidate(user_text)
            
            # Generate audio for response
            audio_bytes = get_audio_bytes(ai_response)
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ""
            
            # Check if interview is complete
            is_complete = interviewer.is_complete
            
            emit('ai_response', {
                'text': ai_response,
                'audio': audio_b64,
                'question_number': interviewer.question_count,
                'is_complete': is_complete
            })
            
            # If complete, send evaluation
            if is_complete:
                handle_interview_complete(session_id)
                
        except Exception as e:
            emit('error', {'message': f'Error processing audio: {str(e)}'})
    
    @socketio.on('user_text')
    def handle_user_text(data):
        """
        Handle text-based candidate response (fallback for no-mic).
        
        Expected data:
            text: Candidate's text response
        """
        session_id = request.sid
        
        if session_id not in interview_sessions:
            emit('error', {'message': 'No active interview session'})
            return
        
        session = interview_sessions[session_id]
        interviewer = session['interviewer']
        
        user_text = data.get('text', '').strip()
        
        if not user_text:
            return
        
        try:
            # Get AI response
            ai_response = interviewer.respond_to_candidate(user_text)
            
            # Generate audio
            audio_bytes = get_audio_bytes(ai_response)
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ""
            
            is_complete = interviewer.is_complete
            
            emit('ai_response', {
                'text': ai_response,
                'audio': audio_b64,
                'question_number': interviewer.question_count,
                'is_complete': is_complete
            })
            
            if is_complete:
                handle_interview_complete(session_id)
                
        except Exception as e:
            emit('error', {'message': f'Error processing response: {str(e)}'})
    
    @socketio.on('end_interview')
    def handle_end_interview(data=None):
        """Force end the interview and get evaluation."""
        session_id = request.sid
        
        if session_id not in interview_sessions:
            emit('error', {'message': 'No active interview session'})
            return
        
        session = interview_sessions[session_id]
        interviewer = session['interviewer']
        
        # Get closing message
        closing = interviewer.end_interview()
        
        emit('ai_response', {
            'text': closing,
            'audio': '',
            'is_complete': True
        })
        
        handle_interview_complete(session_id)
    
    def handle_interview_complete(session_id):
        """Generate and send interview evaluation."""
        if session_id not in interview_sessions:
            return
        
        session = interview_sessions[session_id]
        interviewer = session['interviewer']
        
        try:
            # Get transcript
            transcript = interviewer.get_transcript()
            
            # Evaluate
            evaluation = evaluate_interview(
                job_description=session['jd_text'],
                transcript=transcript,
                candidate_name=session['candidate_name']
            )
            
            # Calculate Round 2 score
            round2_score = get_round2_score(evaluation)
            
            emit('interview_evaluation', {
                'evaluation': evaluation,
                'round2_score': round2_score,
                'transcript': transcript
            })
            
        except Exception as e:
            emit('error', {'message': f'Evaluation failed: {str(e)}'})


# REST API endpoints

@interview_bp.route('/status', methods=['GET'])
def get_status():
    """Check if interview system is available."""
    return jsonify({
        'available': MODEL2_AVAILABLE,
        'active_sessions': len(interview_sessions)
    })


@interview_bp.route('/evaluate', methods=['POST'])
def evaluate_transcript():
    """
    Evaluate an interview transcript (offline evaluation).
    
    Request body:
        jd_text: Job description
        transcript: List of {role, content} messages
        candidate_name: Optional candidate name
    """
    if not MODEL2_AVAILABLE:
        return jsonify({'error': 'Model 2 not available'}), 503
    
    data = request.get_json()
    
    jd_text = data.get('jd_text', '')
    transcript = data.get('transcript', [])
    candidate_name = data.get('candidate_name', 'Candidate')
    
    if not transcript:
        return jsonify({'error': 'No transcript provided'}), 400
    
    try:
        evaluation = evaluate_interview(
            job_description=jd_text,
            transcript=transcript,
            candidate_name=candidate_name
        )
        
        return jsonify({
            'success': True,
            'evaluation': evaluation,
            'round2_score': get_round2_score(evaluation)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
