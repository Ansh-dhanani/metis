"""
METIS Text-to-Speech

Uses gTTS (Google Text-to-Speech) for voice output.
Provides both sync and async options.
"""

import os
import tempfile
from pathlib import Path
from typing import Optional

# Try to import gTTS
try:
    from gtts import gTTS
except ImportError:
    gTTS = None

# Try to import playsound for audio playback
try:
    import playsound
    HAS_PLAYSOUND = True
except ImportError:
    HAS_PLAYSOUND = False


def speak(
    text: str,
    lang: str = "en",
    slow: bool = False,
    play: bool = True
) -> Optional[str]:
    """
    Convert text to speech and optionally play it.
    
    Args:
        text: Text to speak
        lang: Language code (default: English)
        slow: Speak slowly if True
        play: Play audio if True, otherwise just return path
        
    Returns:
        Path to audio file if play=False, otherwise None
    """
    if gTTS is None:
        print(f"[TTS] {text}")  # Fallback to print
        return None
    
    if not text.strip():
        return None
    
    # Create temp file for audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
        temp_path = fp.name
    
    try:
        # Generate speech
        tts = gTTS(text=text, lang=lang, slow=slow)
        tts.save(temp_path)
        
        if play:
            if HAS_PLAYSOUND:
                try:
                    playsound.playsound(temp_path)
                except Exception as e:
                    print(f"[TTS Error] Could not play audio: {e}")
            else:
                print(f"[TTS] Audio saved to {temp_path} (playsound not available)")
            
            # Cleanup after playing
            try:
                os.unlink(temp_path)
            except:
                pass
            return None
        else:
            return temp_path
            
    except Exception as e:
        print(f"[TTS Error] {e}")
        print(f"[TTS Fallback] {text}")
        return None


def speak_async(
    text: str,
    lang: str = "en",
    slow: bool = False
) -> str:
    """
    Generate speech audio file without playing.
    
    Args:
        text: Text to speak
        lang: Language code
        slow: Speak slowly if True
        
    Returns:
        Path to generated MP3 file
    """
    return speak(text, lang, slow, play=False)


def get_audio_bytes(
    text: str,
    lang: str = "en"
) -> bytes:
    """
    Get audio as bytes (useful for WebSocket transfer).
    
    Args:
        text: Text to speak
        lang: Language code
        
    Returns:
        Audio file bytes
    """
    audio_path = speak_async(text, lang)
    
    if audio_path is None:
        return b""
    
    try:
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()
        
        # Cleanup
        try:
            os.unlink(audio_path)
        except:
            pass
        
        return audio_bytes
    except Exception as e:
        print(f"[TTS Error] Could not read audio: {e}")
        return b""
