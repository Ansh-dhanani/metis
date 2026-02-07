"""
Upload Routes

Handles file uploads and candidate profile creation for Round 1.
"""

import os
import sys
import tempfile
from flask import Blueprint, request, jsonify

# Add metis to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'hackathon', 'hackathon'))

upload_bp = Blueprint('upload', __name__, url_prefix='/api/upload')

# Temporary storage for uploaded files
UPLOAD_FOLDER = tempfile.mkdtemp(prefix='metis_uploads_')


@upload_bp.route('/resume', methods=['POST'])
def upload_resume():
    """
    Upload a PDF resume file.
    
    Returns candidate_id for the created profile.
    """
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'success': False, 'error': 'Only PDF files allowed'}), 400
    
    try:
        # Save file temporarily
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)
        
        # Extract text from PDF
        resume_text = ""
        try:
            from pypdf import PdfReader
            reader = PdfReader(filepath)
            for page in reader.pages:
                resume_text += page.extract_text() + "\n"
        except ImportError:
            # Fallback: try reading as text
            with open(filepath, 'r', errors='ignore') as f:
                resume_text = f.read()
        
        # Parse resume
        try:
            from metis.resume_parser import parse_resume
            parsed = parse_resume(resume_text)
            # Convert ParsedResume object to dict
            resume_data = parsed.to_dict() if hasattr(parsed, 'to_dict') else parsed
        except Exception as e:
            resume_data = {
                'raw_text': resume_text,
                'parse_error': str(e)
            }
        
        # Create candidate profile
        from metis.candidate_profile import create_profile
        profile = create_profile(resume_data=resume_data)
        
        return jsonify({
            'success': True,
            'candidate_id': profile.candidate_id,
            'name': profile.name,
            'resume_parsed': True
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@upload_bp.route('/analyze', methods=['POST'])
def analyze_sources():
    """
    Analyze multiple sources (resume text + URLs) and create profile.
    
    Request JSON:
    {
        "resume_text": "...",
        "github_url": "https://github.com/username",
        "portfolio_url": "https://portfolio.com",
        "linkedin_url": "https://linkedin.com/in/..."
    }
    """
    data = request.json or {}
    
    resume_text = data.get('resume_text', '')
    github_url = data.get('github_url', '')
    portfolio_url = data.get('portfolio_url', '')
    linkedin_url = data.get('linkedin_url', '')
    
    try:
        resume_data = {}
        github_data = {}
        portfolio_data = {}
        
        # Parse resume text
        if resume_text:
            try:
                from metis.resume_parser import parse_resume
                parsed = parse_resume(resume_text)
                resume_data = parsed.to_dict() if hasattr(parsed, 'to_dict') else parsed
            except Exception as e:
                resume_data = {'raw_text': resume_text, 'error': str(e)}
        
        # Analyze GitHub
        if github_url:
            try:
                from metis.github_analyzer import analyze
                github_data = analyze(github_url)
            except Exception as e:
                github_data = {'error': str(e), 'url': github_url}
        
        # Analyze Portfolio
        if portfolio_url:
            try:
                from metis.portfolio_analyzer import analyze
                portfolio_data = analyze(portfolio_url)
            except Exception as e:
                portfolio_data = {'error': str(e), 'url': portfolio_url}
        
        # Create unified profile
        from metis.candidate_profile import create_profile
        profile = create_profile(
            resume_data=resume_data,
            github_data=github_data,
            portfolio_data=portfolio_data
        )
        
        # Store LinkedIn URL
        if linkedin_url:
            profile.linkedin_url = linkedin_url
        
        return jsonify({
            'success': True,
            'profile': profile.to_dict()
        })
        
    except Exception as e:
        import traceback
        return jsonify({
            'success': False, 
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@upload_bp.route('/analyze-file', methods=['POST'])
def analyze_with_file():
    """
    Upload PDF + URLs and analyze all at once.
    
    Form data:
    - file: PDF resume file
    - github_url: (optional) GitHub profile URL
    - portfolio_url: (optional) Portfolio website URL
    - linkedin_url: (optional) LinkedIn profile URL
    """
    resume_text = ""
    
    # Handle file upload
    if 'file' in request.files:
        file = request.files['file']
        if file.filename and file.filename.lower().endswith('.pdf'):
            try:
                filepath = os.path.join(UPLOAD_FOLDER, file.filename)
                file.save(filepath)
                
                from pypdf import PdfReader
                reader = PdfReader(filepath)
                for page in reader.pages:
                    resume_text += page.extract_text() + "\n"
            except Exception as e:
                print(f"PDF extraction error: {e}")
    
    # Get URLs from form
    github_url = request.form.get('github_url', '')
    portfolio_url = request.form.get('portfolio_url', '')
    linkedin_url = request.form.get('linkedin_url', '')
    
    try:
        resume_data = {}
        github_data = {}
        portfolio_data = {}
        
        # Parse resume
        if resume_text:
            try:
                from metis.resume_parser import parse_resume
                parsed = parse_resume(resume_text)
                resume_data = parsed.to_dict() if hasattr(parsed, 'to_dict') else parsed
            except Exception as e:
                resume_data = {'raw_text': resume_text}
        
        # Analyze GitHub (sync)
        if github_url:
            try:
                from metis.github_analyzer import analyze
                github_data = analyze(github_url)
            except Exception as e:
                github_data = {'error': str(e)}
        
        # Analyze Portfolio (sync)
        if portfolio_url:
            try:
                from metis.portfolio_analyzer import analyze
                portfolio_data = analyze(portfolio_url)
            except Exception as e:
                portfolio_data = {'error': str(e)}
        
        # Create profile
        from metis.candidate_profile import create_profile
        profile = create_profile(
            resume_data=resume_data,
            github_data=github_data,
            portfolio_data=portfolio_data
        )
        
        if linkedin_url:
            profile.linkedin_url = linkedin_url
        
        return jsonify({
            'success': True,
            'profile': profile.to_dict()
        })
        
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@upload_bp.route('/profile/<candidate_id>', methods=['GET'])
def get_profile(candidate_id):
    """Get a candidate profile by ID."""
    try:
        from metis.candidate_profile import get_profile as get_prof
        profile = get_prof(candidate_id)
        
        if not profile:
            return jsonify({'success': False, 'error': 'Profile not found'}), 404
        
        return jsonify({
            'success': True,
            'profile': profile.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@upload_bp.route('/profiles', methods=['GET'])
def list_profiles():
    """List all candidate profiles."""
    try:
        from metis.candidate_profile import list_profiles as list_profs
        profiles = list_profs()
        
        return jsonify({
            'success': True,
            'count': len(profiles),
            'profiles': profiles
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
