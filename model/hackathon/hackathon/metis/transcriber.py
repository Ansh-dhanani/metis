"""
METIS Speech-to-Text Transcriber

Uses Groq's Whisper API for fast, accurate transcription.
"""

import os
from pathlib import Path
from typing import Dict, Optional

# Try to import Groq
try:
    from groq import Groq
except ImportError:
    Groq = None


def transcribe_audio(
    audio_path: str,
    language: str = "en"
) -> Dict:
    """
    Transcribe audio file using Groq Whisper API.
    
    Args:
        audio_path: Path to audio file (wav, mp3, webm, etc.)
        language: Language code (default: English)
        
    Returns:
        Dict with 'text' key containing transcription
    """
    if Groq is None:
        raise ImportError("groq package required. Install with: pip install groq")
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable required")
    
    client = Groq(api_key=api_key)
    
    audio_file = Path(audio_path)
    if not audio_file.exists():
        return {"text": "", "error": f"File not found: {audio_path}"}
    
    try:
        with open(audio_path, "rb") as f:
            response = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=f,
                language=language,
                response_format="text"
            )
        
        # Response is just the text string
        text = response if isinstance(response, str) else str(response)
        
        return {
            "text": text.strip(),
            "language": language,
            "duration": None  # Could parse from file if needed
        }
        
    except Exception as e:
        return {
            "text": "",
            "error": str(e)
        }


def transcribe_from_bytes(
    audio_bytes: bytes,
    filename: str = "audio.wav",
    language: str = "en"
) -> Dict:
    """
    Transcribe audio from bytes (useful for WebSocket audio).
    
    Args:
        audio_bytes: Raw audio bytes
        filename: Filename hint for format detection
        language: Language code
        
    Returns:
        Dict with 'text' key containing transcription
    """
    import tempfile
    
    # Get extension from filename
    ext = Path(filename).suffix or ".wav"
    
    # Write to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as fp:
        fp.write(audio_bytes)
        temp_path = fp.name
    
    try:
        result = transcribe_audio(temp_path, language)
        return result
    finally:
        # Cleanup temp file
        try:
            os.unlink(temp_path)
        except:
            pass
