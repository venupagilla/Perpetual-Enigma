from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Shark Tank Pitch Simulator API")

SHARKS = [
    "Aman Gupta", "Ashneer Grover", "Anupam Mittal", 
    "Peyush Bansal", "Vineeta Singh", "Nithin Kamath", "Deepinder Goyal"
]

# Initialize the Groq model
try:
    model = ChatGroq(model="llama-3.3-70b-versatile")
except Exception as e:
    model = None
    print(f"Error initializing ChatGroq: {e}")

# In-memory session storage (In a production app, use Redis or a Database)
# Format: session_id -> {"shark": str, "messages": List[BaseMessage], "history": List[str], "status": str}
sessions = {}

# --- Pydantic Models for Input/Output ---
class StartPitchRequest(BaseModel):
    shark_name: str

class StartPitchResponse(BaseModel):
    session_id: str
    message: str

class ChatMessageRequest(BaseModel):
    session_id: str
    user_message: str

class ChatMessageResponse(BaseModel):
    reply: str
    status: str # Expected to be one of: "active", "invested", "out"

class FeedbackRequest(BaseModel):
    session_id: str

class FeedbackResponse(BaseModel):
    feedback: str

# --- API Endpoints ---
@app.get("/sharks")
def get_sharks():
    """Returns the list of available sharks."""
    return {"sharks": SHARKS}

@app.post("/pitch/start", response_model=StartPitchResponse)
def start_pitch(req: StartPitchRequest):
    """Initializes a new pitch session with the selected shark."""
    if req.shark_name not in SHARKS:
        raise HTTPException(status_code=400, detail="Invalid shark selected.")
    
    session_id = str(uuid.uuid4())
    system_prompt = f"""You are {req.shark_name} from Shark Tank India.
A participant is pitching their product to you. 
Behave exactly like {req.shark_name}, using their typical catchphrases, tone, and investment style.
The user will first introduce their product. Respond by asking a relevant, probing question about their business (e.g., sales, equity, market size, profitability). 
Ask only ONE question at a time. Wait for the user's answer.
After 3 to 4 turns of conversation, you must make a final decision to either invest or pass.
When you make your final decision, conclude your response with either "[INVEST]" if you are offering a deal, or "[OUT]" if you are not investing.
"""
    sessions[session_id] = {
        "shark": req.shark_name,
        "messages": [SystemMessage(content=system_prompt)],
        "history": [],
        "status": "active"
    }
    
    return StartPitchResponse(
        session_id=session_id,
        message=f"You selected {req.shark_name}. Start your pitch by introducing your product!"
    )

@app.post("/pitch/chat", response_model=ChatMessageResponse)
def chat_with_shark(req: ChatMessageRequest):
    """Sends a message to the chosen shark and gets their reply."""
    if req.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    session = sessions[req.session_id]
    if session["status"] != "active":
        return ChatMessageResponse(reply="This pitch has already concluded.", status=session["status"])

    # Append user's message
    session["messages"].append(HumanMessage(content=req.user_message))
    session["history"].append(f"User: {req.user_message}")
    
    try:
        response = model.invoke(session["messages"])
        reply = response.content
        
        # Append AI's reply
        session["messages"].append(AIMessage(content=reply))
        session["history"].append(f"{session['shark']}: {reply}")
        
        # Check for conclusion parameters
        reply_upper = reply.upper()
        if "[INVEST]" in reply_upper or "I AM IN" in reply_upper:
            session["status"] = "invested"
        elif "[OUT]" in reply_upper or "I AM OUT" in reply_upper or "I'M OUT" in reply_upper:
            session["status"] = "out"
            
        return ChatMessageResponse(reply=reply, status=session["status"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pitch/feedback", response_model=FeedbackResponse)
def get_feedback(req: FeedbackRequest):
    """Generates structured feedback for a concluded pitch session."""
    if req.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    session = sessions[req.session_id]
    if not session["history"]:
        raise HTTPException(status_code=400, detail="No conversation history to evaluate.")
        
    conversation_text = "\n".join(session["history"])
    feedback_prompt = f"""You are {session['shark']} from Shark Tank India. Review the following conversation you just had with a founder.
Identify the mistakes the founder made during the pitch and Q&A. Provide constructive feedback on how they can improve their pitch, business model, and negotiation skills.
Speak directly to the founder as {session['shark']}, using your typical catchphrases and tone.
Crucially, output your entire response as a single, continuous paragraph without any line breaks, bullet points, or sections.

Conversation:
{conversation_text}"""

    feedback_messages = [
        SystemMessage(content=f"You are {session['shark']} from Shark Tank India. You are giving direct, post-pitch feedback to a founder. Write exactly one continuous paragraph."),
        HumanMessage(content=feedback_prompt)
    ]
    
    try:
        response = model.invoke(feedback_messages)
        return FeedbackResponse(feedback=response.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
