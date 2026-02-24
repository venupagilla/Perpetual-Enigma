import speech_recognition as sr
import os
import tempfile
import requests
from pydub import AudioSegment
from pydub.playback import play
from groq import Groq
from dotenv import load_dotenv

# Load env variables (GROQ_API_KEY and SARVAM_API_KEY)
load_dotenv()

# Initialize standard Groq client for Whisper transcripiton
try:
    groq_client = Groq()
except Exception as e:
    print(f"Failed to initialize Groq client: {e}")
    groq_client = None

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

def speak_text(text: str):
    """Speaks the text out loud using Sarvam AI streaming TTS API."""
    print(f"[Speaking]: {text}")
    
    if not SARVAM_API_KEY:
        print("[Error]: Sarvam API Key not found in .env file. Falling back to print-only.")
        return

    # Sarvam Streaming Text-to-Speech API Config
    url = "https://api.sarvam.ai/text-to-speech/stream"
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    
    # Updated payload according to official docs
    payload = {
        "text": text,
        "target_language_code": "hi-IN",
        "speaker": "shubh",
        "model": "bulbul:v3",
        "pace": 1.1,
        "speech_sample_rate": 22050,
        "enable_preprocessing": True
    }

    try:
        # Stream the response
        response = requests.post(url, headers=headers, json=payload, stream=True)
        
        # If the status code is not 200, raise it, but let's grab the error text first
        if response.status_code != 200:
            print(f"[Sarvam API Error Data]: {response.text}")
            
        response.raise_for_status()
        
        import pygame
        
        # Save the streamed audio to a temporary mp3 file
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
            temp_filename = temp_audio.name
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp_audio.write(chunk)
        
        # Initialize pygame mixer and play the downloaded MP3
        # Pygame is much friendlier on Windows, no FFMPEG dependency
        pygame.mixer.init()
        pygame.mixer.music.load(temp_filename)
        pygame.mixer.music.play()
        
        # Wait for the audio to finish playing
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
            
        # Cleanup internal handles so the temp file can be deleted safely
        pygame.mixer.music.unload()
        pygame.mixer.quit()
        
            
    except Exception as e:
        print(f"[Sarvam API/Playback Error]: {e}")
    finally:
        # Ensure we clean up the MP3 file after playing or failing
        if 'temp_filename' in locals() and os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except OSError:
                pass

def listen_for_speech() -> str:
    """Listens to the microphone and transcribes speech using Groq's whisper model."""
    if not groq_client:
        print("[Error]: Groq client not initialized. Ensure GROQ_API_KEY is in .env.")
        return ""

    recognizer = sr.Recognizer()
    
    with sr.Microphone() as source:
        print("\n[Microphone]: Adjusting for ambient noise... Please wait.")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        print("[Microphone]: Listening... Speak now!")
        
        try:
            # Listen to the user's input with a timeout
            audio = recognizer.listen(source, timeout=10, phrase_time_limit=30)
            print("[Microphone]: Processing and transcribing speech...")
            
            # Save the captured audio temporarily to a WAV file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
                temp_filename_wav = temp_wav.name
                with open(temp_filename_wav, "wb") as f:
                    f.write(audio.get_wav_data())
            
            # Request Whisper transcription via Groq
            with open(temp_filename_wav, "rb") as audio_file:
                transcription = groq_client.audio.transcriptions.create(
                    file=(temp_filename_wav, audio_file.read()),
                    model="whisper-large-v3-turbo",
                )
            
            # Clean up the temporary file
            os.remove(temp_filename_wav)
            
            text = transcription.text.strip()
            print(f"[Transcribed via Whisper]: {text}")
            return text
            
        except sr.WaitTimeoutError:
            print("[Error]: Listening timed out. No speech detected.")
            return ""
        except Exception as e:
            print(f"[Error]: An unexpected error occurred during transcription: {e}")
            return ""

# For testing this module directly
if __name__ == "__main__":
    print("--- Voice Input Module Test (Whisper Turbo) ---")
    speak_text("Hello! I am reading using Whisper large v3 turbo. Please say something.")
    
    recognized_text = listen_for_speech()
    if recognized_text:
        speak_text(f"You said: {recognized_text}")
    else:
        speak_text("I didn't catch that.")

# For testing this module directly
if __name__ == "__main__":
    print("--- Voice Input Module Test ---")
    speak_text("Hello! I am ready to listen. Please say something.")
    
    recognized_text = listen_for_speech()
    if recognized_text:
        speak_text(f"You said: {recognized_text}")
    else:
        speak_text("I didn't catch that.")
