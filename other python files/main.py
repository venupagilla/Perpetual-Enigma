import sys
import os
from typing import List
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage

# Add current directory to path so it can find voice_input alongside it
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Attempt to load voice modules
try:
    from voice_input import listen_for_speech, speak_text
    VOICE_AVAILABLE = True
except ImportError as e:
    VOICE_AVAILABLE = False
    print(f"Voice modules not found. Launching in Text-Only mode. (Error: {e})")

# Load environment variables (like GROQ_API_KEY)
load_dotenv()

SHARKS = [
    "Aman Gupta", "Ashneer Grover", "Anupam Mittal", 
    "Peyush Bansal", "Vineeta Singh", "Nithin Kamath", "Deepinder Goyal"
]

def get_shark_selection() -> str:
    """Prompt the user to select a shark, strictly enforcing valid inputs."""
    print("\nSelect the shark from the below:")
    for i, shark in enumerate(SHARKS, 1):
        print(f" {i}. {shark}")
        
    while True:
        user_input = input("\nUser (Enter choice 1-7): ").strip()
        try:
            shark_idx = int(user_input) - 1
            if 0 <= shark_idx < len(SHARKS):
                return SHARKS[shark_idx]
            else:
                print("Invalid choice. Please select a valid number from the list.")
        except ValueError:
            print("Invalid input. Please enter a number.")

def get_input_mode() -> str:
    """Prompt the user to choose between Text and Voice interaction."""
    if not VOICE_AVAILABLE:
        return "text"
        
    print("\nHow would you like to pitch?")
    print(" 1. Text (Type your pitch)")
    print(" 2. Voice (Speak your pitch into the microphone)")
    
    while True:
        choice = input("\nSelect mode (1/2): ").strip()
        if choice in ['1', 'text', 'Text']:
            return "text"
        elif choice in ['2', 'voice', 'Voice']:
            return "voice"
        print("Invalid choice. Please enter 1 for Text or 2 for Voice.")

def run_pitch_session(model: ChatGroq, selected_shark: str, input_mode: str) -> List[str]:
    """Runs the interactive conversation loop with the LLM persona."""
    print(f"\n[System]: You selected {selected_shark}.")
    
    if input_mode == "voice":
        intro = f"Start your pitch by speaking! Say 'exit' or 'quit' to stop at any time."
        print(f"🎙️ [System]: {intro}\n")
        speak_text(intro)
    else:
        print(f"⌨️ [System]: Start your pitch by introducing your product! (Type 'exit' to stop)\n")
    
    system_prompt = f"""You are {selected_shark} from Shark Tank India.
A participant is pitching their product to you. 
Behave exactly like {selected_shark}, using their typical catchphrases, tone, and investment style.
The user will first introduce their product. Respond by asking a relevant, probing question about their business (e.g., sales, equity, market size, profitability). 
Ask only ONE question at a time. Wait for the user's answer.
After 3 to 4 turns of conversation, you must make a final decision to either invest or pass.
When you make your final decision, conclude your response with either "[INVEST]"  if you are offering a deal, or "[OUT]" if you are not investing and only speak in english no hinglish.
"""
    
    # Use proper LangChain message objects
    messages: List[BaseMessage] = [SystemMessage(content=system_prompt)]
    conversation_history: List[str] = []
    
    while True:
        if input_mode == "voice":
            user_text = listen_for_speech()
            # If nothing was transcribed, prompt again
            if not user_text:
                continue
        else:
            user_text = input("User : ").strip()
            
        if user_text.lower() in ['exit', 'quit']:
            print("[System]: Exiting pitch loop...")
            break
            
        messages.append(HumanMessage(content=user_text))
        conversation_history.append(f"User: {user_text}")
        
        try:
            print(f"\n[{selected_shark} is thinking...]")
            response = model.invoke(messages)
            reply = response.content
            
            messages.append(AIMessage(content=reply))
            conversation_history.append(f"{selected_shark}: {reply}")
            print(f"\n{selected_shark} : {reply}\n")
            
            # Speak out the Shark's reply
            if input_mode == "voice":
                speak_text(reply)
            
            # Check exit conditions based on model's decision
            reply_upper = reply.upper()
            exit_phrases = ["[INVEST]", "[OUT]", "I AM OUT", "I'M OUT", "I AM IN"]
            if any(phrase in reply_upper for phrase in exit_phrases):
                break
                
        except Exception as e:
            print(f"\n[Error communicating with model]: {e}")
            break
            
    return conversation_history

def generate_feedback(model: ChatGroq, selected_shark: str, conversation_history: List[str], input_mode: str):
    """Analyzes the finished pitch history and generates structured feedback."""
    print("\n--- Pitch Concluded ---")
    print("\n--- Full Conversation Transcript ---")
    for line in conversation_history:
        print(line)

    print("\nEvaluating your pitch and identifying mistakes...\n")
    
    conversation_text = "\n".join(conversation_history)
    feedback_prompt = f"""You are {selected_shark} from Shark Tank India. Review the following conversation you just had with a founder.
Identify the mistakes the founder made during the pitch and Q&A. Provide constructive feedback on how they can improve their pitch, business model, and negotiation skills.
Speak directly to the founder as {selected_shark}, using your typical catchphrases and tone.
Crucially, output your entire response as a single, continuous paragraph without any line breaks, bullet points, or sections.

Conversation:
{conversation_text}"""
    
    feedback_messages = [
        SystemMessage(content=f"You are {selected_shark} from Shark Tank India. You are giving direct, post-pitch feedback to a founder. Write exactly one continuous paragraph."),
        HumanMessage(content=feedback_prompt)
    ]
    
    try:
        feedback_response = model.invoke(feedback_messages)
        feedback_reply = feedback_response.content
        print("\n--- Feedback Regarding Your Mistakes ---")
        print(feedback_reply)
        
        if input_mode == "voice":
            print("\n[Speaking Feedback...]")
            speak_text(feedback_reply)
            
    except Exception as e:
         print(f"\n[Error generating feedback]: {e}")

def main():
    try:
        model = ChatGroq(model="llama-3.3-70b-versatile")
    except Exception as e:
        print("Error initializing ChatGroq. Please ensure your GROQ_API_KEY is properly set in the .env file.")
        sys.exit(1)
        
    selected_shark = get_shark_selection()
    input_mode = get_input_mode()
    
    history = run_pitch_session(model, selected_shark, input_mode)
    
    # Only generate feedback if a conversation actually happened
    if history:
        generate_feedback(model, selected_shark, history, input_mode)

if __name__ == "__main__":
    main()
