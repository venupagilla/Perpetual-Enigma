import os
import sys
import json
import uuid
import tempfile
import requests
import asyncio
import logging
from typing import List, Dict, Any, Literal, TypedDict, Optional
from contextlib import asynccontextmanager

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Audio and Voice (Gated for Cloud Deployment)
try:
    import pygame
    import speech_recognition as sr
except ImportError:
    print("Warning: pygame or speech_recognition not found. Voice features will be disabled.")
    pygame = None
    sr = None

import re
import time
from bs4 import BeautifulSoup

# FastAPI
from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Langchain
from langchain_groq import ChatGroq
# from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

import uvicorn

# ============================================================================
# CONFIGURATION & LOGGING
# ============================================================================
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class Config:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "2048"))
    APP_NAME: str = "MarketEasy Integrated Assistant"
    APP_VERSION: str = "1.0.0"

# Initialize global LLMs
try:
    groq_api_key = Config.GROQ_API_KEY
    groq_client = ChatGroq(model=Config.LLM_MODEL, temperature=Config.LLM_TEMPERATURE, api_key=groq_api_key)
    from groq import Groq
    groq_audio_client = Groq(api_key=groq_api_key) if groq_api_key else None
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {e}")
    groq_client, groq_audio_client = None, None

try:
    groq_llm = groq_client
except Exception as e:
    logger.error(f"Failed to initialize Groq LLM for JSON: {e}")
    groq_llm = None


# ============================================================================
# MODULE 1: VOICE INPUT & OUTPUT
# ============================================================================
def speak_text(text: str):
    """Speaks the text out loud using Sarvam AI streaming TTS API."""
    print(f"[Speaking]: {text}")
    
    if not pygame:
        print("[Error]: pygame not installed. Cannot play audio in this environment.")
        return

    if not Config.SARVAM_API_KEY:
        print("[Error]: Sarvam API Key not found in .env file. Falling back to print-only.")
        return

    url = "https://api.sarvam.ai/text-to-speech/stream"
    headers = {"api-subscription-key": Config.SARVAM_API_KEY, "Content-Type": "application/json"}
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
        response = requests.post(url, headers=headers, json=payload, stream=True)
        if response.status_code != 200:
            print(f"[Sarvam API Error Data]: {response.text}")
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
            temp_filename = temp_audio.name
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp_audio.write(chunk)
        
        pygame.mixer.init()
        pygame.mixer.music.load(temp_filename)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.music.unload()
        pygame.mixer.quit()
    except Exception as e:
        print(f"[Sarvam API/Playback Error]: {e}")
    finally:
        if 'temp_filename' in locals() and os.path.exists(temp_filename):
            try: os.remove(temp_filename)
            except OSError: pass

def listen_for_speech() -> str:
    """Listens to the microphone and transcribes speech using Groq's whisper model."""
    if not sr:
        print("[Error]: speech_recognition not installed. Voice input disabled.")
        return ""
    if not groq_audio_client:
        print("[Error]: Groq audio client not initialized.")
        return ""

    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("\n[Microphone]: Adjusting for ambient noise... Please wait.")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        print("[Microphone]: Listening... Speak now!")
        
        try:
            audio = recognizer.listen(source, timeout=10, phrase_time_limit=30)
            print("[Microphone]: Processing and transcribing speech...")
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
                temp_filename_wav = temp_wav.name
                with open(temp_filename_wav, "wb") as f:
                    f.write(audio.get_wav_data())
            
            with open(temp_filename_wav, "rb") as audio_file:
                transcription = groq_audio_client.audio.transcriptions.create(
                    file=(temp_filename_wav, audio_file.read()),
                    model="whisper-large-v3-turbo",
                )
            os.remove(temp_filename_wav)
            text = transcription.text.strip()
            print(f"[Transcribed via Whisper]: {text}")
            return text
        except sr.WaitTimeoutError:
            print("[Error]: Listening timed out. No speech detected.")
            return ""
        except Exception as e:
            print(f"[Error]: An unexpected error during transcription: {e}")
            return ""


# ============================================================================
# MODULE 2: LINKEDIN CAMPAIGN GRAPH (LangGraph)
# ============================================================================
class JsonParsingLLMWrapper:
    def invoke(self, prompt: str) -> dict:
        if not groq_llm: return {"error": "Groq LLM missing"}
        response = groq_llm.invoke(prompt)
        content = response.content.strip()
        if content.startswith("```json"): content = content[7:]
        elif content.startswith("```"): content = content[3:]
        if content.endswith("```"): content = content[:-3]
        try: return json.loads(content.strip())
        except json.JSONDecodeError: return {"error": "JSON parse failed", "raw_content": content}

linkedin_llm = JsonParsingLLMWrapper()

class LinkedInGraphState(TypedDict):
    chat_history: list
    user_input: str
    intent: str
    context: dict
    response: dict
    post_draft: dict
    user_feedback: str
    approval_status: str
    webhook_response: dict

LINKEDIN_HARDCODED_CONTEXT = {
    "company_name": "MarketAI", "industry": "SaaS", "product": "AI-powered marketing assistant",
    "default_target": "Startup founders and small businesses", "default_tone": "Professional and engaging"
}

def lk_chat_node(state: LinkedInGraphState):
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in state.get("chat_history", [])])
    prompt = f"""You are a helpful and intelligent marketing assistant AI. Act normally, but route to 'campaign_generation' or 'post_generation' if asked.
Context: {json.dumps(state.get('context', {}))}
History: {history_text}
User: {state['user_input']}
Return exact JSON: {{ "route_decision": "chat" | "campaign_generation" | "post_generation", "assistant_reply": "..." }}"""
    res = linkedin_llm.invoke(prompt)
    new_history = list(state.get("chat_history", [])) + [{"role": "user", "content": state["user_input"]}, {"role": "assistant", "content": res.get("assistant_reply", "Hi")}]
    return {"chat_history": new_history, "intent": res.get("route_decision", "chat"), "response": {"chat_reply": res.get("assistant_reply", "Hi")}}

def lk_campaign_node(state: LinkedInGraphState):
    prompt = f"Create a structured marketing campaign strategy strictly in JSON format based on: {state['user_input']} and context: {json.dumps(state['context'])}"
    return {"response": linkedin_llm.invoke(prompt)}

def lk_post_node(state: LinkedInGraphState):
    prompt = f"Draft an engaging social media post in JSON based on: {state['user_input']} and context: {json.dumps(state['context'])}"
    return {"post_draft": linkedin_llm.invoke(prompt), "approval_status": "pending"}

def lk_human_review_node(state: LinkedInGraphState): pass

def lk_refinement_node(state: LinkedInGraphState):
    prompt = f"Refine this JSON post draft: {json.dumps(state.get('post_draft', {}))} using this feedback: {state.get('user_feedback', '')}."
    return {"post_draft": linkedin_llm.invoke(prompt), "approval_status": "pending"}

def lk_webhook_node(state: LinkedInGraphState):
    url = os.getenv("WEBHOOK_URL", "https://hook.eu2.make.com/q7gpp2ii4d9c1vw5qlpwz1a4ps55g27q")
    key = os.getenv("WEBHOOK_API_KEY", "j6G3JDCs-n.mw2n")
    try:
        req = requests.post(url, json=state.get("post_draft", {}), headers={"x-make-apikey": key}, timeout=10)
        req.raise_for_status()
        return {"webhook_response": {"status": "success"}}
    except Exception as e:
        return {"webhook_response": {"status": "error", "error_message": str(e)}}

linkedin_builder = StateGraph(LinkedInGraphState)
linkedin_builder.add_node("chat_node", lk_chat_node)
linkedin_builder.add_node("campaign_node", lk_campaign_node)
linkedin_builder.add_node("post_node", lk_post_node)
linkedin_builder.add_node("human_review_node", lk_human_review_node)
linkedin_builder.add_node("refinement_node", lk_refinement_node)
linkedin_builder.add_node("webhook_node", lk_webhook_node)

linkedin_builder.set_entry_point("chat_node")
linkedin_builder.add_conditional_edges("chat_node", lambda s: "campaign_node" if s.get("intent") == "campaign_generation" else ("post_node" if s.get("intent") == "post_generation" else END))
linkedin_builder.add_edge("campaign_node", END)
linkedin_builder.add_edge("post_node", "human_review_node")
linkedin_builder.add_conditional_edges("human_review_node", lambda s: "webhook_node" if s.get("approval_status") == "approved" else "refinement_node")
linkedin_builder.add_edge("refinement_node", "human_review_node")
linkedin_builder.add_edge("webhook_node", END)

linkedin_graph = linkedin_builder.compile(checkpointer=MemorySaver(), interrupt_before=["human_review_node"])

linkedin_router = APIRouter(prefix="/api/linkedin", tags=["linkedin"])

class LinkedInChatReq(BaseModel):
    thread_id: str
    user_message: str

class LinkedInProcessReq(BaseModel):
    thread_id: str
    user_feedback: Optional[str] = None
    approve: bool = False

@linkedin_router.post("/chat")
def linkedin_chat(req: LinkedInChatReq):
    thread_config = {"configurable": {"thread_id": req.thread_id}}
    
    # Check if this thread already has context
    state = linkedin_graph.get_state(thread_config)
    if not state.values:
        linkedin_graph.update_state(thread_config, {"context": LINKEDIN_HARDCODED_CONTEXT})
        
    for _ in linkedin_graph.stream({"user_input": req.user_message}, config=thread_config, stream_mode="values"): pass
    current_state = linkedin_graph.get_state(thread_config).values
    
    return {
        "intent": current_state.get("intent"),
        "response": current_state.get("response"),
        "post_draft": current_state.get("post_draft"),
        "approval_status": current_state.get("approval_status")
    }

@linkedin_router.post("/process")
def linkedin_process(req: LinkedInProcessReq):
    thread_config = {"configurable": {"thread_id": req.thread_id}}
    
    if req.approve:
        linkedin_graph.update_state(thread_config, {"approval_status": "approved"}, as_node="human_review_node")
    elif req.user_feedback:
        linkedin_graph.update_state(thread_config, {"user_feedback": req.user_feedback, "approval_status": "pending"}, as_node="human_review_node")
    else:
        raise HTTPException(status_code=400, detail="Must provide feedback or approval")
        
    for _ in linkedin_graph.stream(None, config=thread_config, stream_mode="values"): pass
    
    current_state = linkedin_graph.get_state(thread_config).values
    return {
        "post_draft": current_state.get("post_draft"),
        "webhook_response": current_state.get("webhook_response"),
        "approval_status": current_state.get("approval_status")
    }


# ============================================================================
# MODULE 3: PITCH GENERATOR API LOGIC
# ============================================================================
class PitchRequest(BaseModel):
    product: str
    audience: Literal["investor", "customer", "b2b", "partner"]
    time_limit: Literal["30s", "60s", "120s"]
    tone: str
    language: str = "english"

class PitchRegenerateRequest(PitchRequest):
    previous_pitch: str
    user_feedback: str = ""
    excluded_formats: list[str] = []

pitch_router = APIRouter(prefix="/api/pitch-generator", tags=["pitch-generator"])

@pitch_router.post("/generate", response_model=dict)
async def generate_pitch_api(req: PitchRequest):
    if not groq_client: raise HTTPException(status_code=500, detail="Groq LLM not configured.")
    try:
        prompt = PromptTemplate(
            input_variables=["product", "audience", "duration", "tone", "language"],
            template="Write a {duration_len} words sales pitch for {product} targeting {audience}. Tone: {tone}. Language: {language}. Write ONLY the pitch script."
        )
        chain = prompt | groq_client
        word_length=0
        if(req.time_limit=="30s"):
            word_length=75
        elif(req.time_limit=="60s"):
            word_length=150
        elif(req.time_limit=="120s"):
            word_length=250
        res = await chain.ainvoke({"product": req.product, "audience": req.audience, "duration_len": word_length, "tone": req.tone, "language": req.language})
        return {"success": True, "pitch": {"script": res.content, "format_style": "standard"}, "message": "Success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@pitch_router.post("/regenerate", response_model=dict)
async def regenerate_pitch_api(req: PitchRegenerateRequest):
    if not groq_client: raise HTTPException(status_code=500, detail="Groq LLM not configured.")
    try:
        prompt = PromptTemplate(
            input_variables=["product", "previous", "feedback"],
            template="Regenerate a pitch for {product}. The previous pitch was: {previous}. The user feedback was: {feedback}. Output ONLY the new script."
        )
        chain = prompt | groq_client
        res = await chain.ainvoke({"product": req.product, "previous": req.previous_pitch, "feedback": req.user_feedback})
        return {"success": True, "pitch": {"script": res.content, "format_style": "refined"}, "message": "Success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MODULE 4: PITCHLAB API (+ CLI LOGIC)
# ============================================================================
VENTURE_PARTNERS = ["Aman Gupta", "Ashneer Grover", "Anupam Mittal", "Peyush Bansal", "Vineeta Singh", "Nithin Kamath", "Deepinder Goyal"]
pitchlab_sessions = {}

class StartPitchLabReq(BaseModel): partner_name: str
class ChatPitchLabReq(BaseModel): session_id: str; user_message: str
class FeedbackPitchLabReq(BaseModel): session_id: str

pitchlab_router = APIRouter(prefix="/api/pitch-lab", tags=["pitch-lab"])

@pitchlab_router.get("/partners")
def get_partners(): return {"partners": VENTURE_PARTNERS}

@pitchlab_router.post("/start")
def start_pitchlab_session(req: StartPitchLabReq):
    session_id = str(uuid.uuid4())
    system_prompt = f"You are {req.partner_name}, a seasoned Venture Partner at PitchLab. The user is pitching their startup to you. Ask 1 challenging question at a time. Conclude with [INVEST] or [OUT] eventually based on the quality of the pitch."
    pitchlab_sessions[session_id] = {"partner": req.partner_name, "messages": [SystemMessage(content=system_prompt)], "history": [], "status": "active"}
    return {"session_id": session_id, "message": f"You are now in PitchLab with {req.partner_name}. Start your pitch!"}

@pitchlab_router.post("/chat")
def chat_pitchlab(req: ChatPitchLabReq):
    session = pitchlab_sessions.get(req.session_id)
    if not session or session["status"] != "active": raise HTTPException(400, "Invalid or concluded session")
    session["messages"].append(HumanMessage(content=req.user_message))
    session["history"].append(f"User: {req.user_message}")
    reply = groq_client.invoke(session["messages"]).content
    session["messages"].append(AIMessage(content=reply))
    session["history"].append(f"{session['partner']}: {reply}")
    
    if "[INVEST]" in reply.upper() or "I AM IN" in reply.upper(): session["status"] = "invested"
    elif "[OUT]" in reply.upper() or "I'M OUT" in reply.upper(): session["status"] = "out"
    return {"reply": reply, "status": session["status"]}

@pitchlab_router.post("/voice-chat")
def voice_chat_pitchlab(req: FeedbackPitchLabReq):
    session = pitchlab_sessions.get(req.session_id)
    if not session or session["status"] != "active": raise HTTPException(400, "Invalid or concluded session")
    
    user_text = listen_for_speech()
    if not user_text:
        return {"reply": "I didn't hear anything. Could you repeat that?", "status": session["status"], "user_text": ""}

    session["messages"].append(HumanMessage(content=user_text))
    session["history"].append(f"User: {user_text}")
    
    reply = groq_client.invoke(session["messages"]).content
    session["messages"].append(AIMessage(content=reply))
    session["history"].append(f"{session['partner']}: {reply}")

    speak_text(reply)
    
    if "[INVEST]" in reply.upper() or "I AM IN" in reply.upper(): session["status"] = "invested"
    elif "[OUT]" in reply.upper() or "I'M OUT" in reply.upper(): session["status"] = "out"
    
    return {"user_text": user_text, "reply": reply, "status": session["status"]}

@pitchlab_router.post("/feedback")
def get_pitchlab_feedback(req: FeedbackPitchLabReq):
    session = pitchlab_sessions.get(req.session_id)
    if not session or not session["history"]: raise HTTPException(400, "Invalid session")
    hist = "\n".join(session["history"])
    prompt = f"You are {session['partner']}. Provide constructive feedback on this conversation in ONE single continuous paragraph.\n\n{hist}"
    msgs = [SystemMessage(content=f"You are {session['partner']}. Provide one paragraph feedback."), HumanMessage(content=prompt)]
    return {"feedback": groq_client.invoke(msgs).content}





# ============================================================================
# MODULE 5: B2B LEAD GENERATION PIPELINE
# ============================================================================

LEADGEN_ICP = {
    "product": "AI marketing automation tool",
    "target_industries": ["SaaS", "Ecommerce", "Marketing Technology", "AdTech"],
    "company_size": ["10-200"],
    "region": "Global",
}

LEADGEN_SCORING_WEIGHTS = {
    "industry": 30, "company_size": 20, "growth_signal": 20, "hiring_intent": 15, "funding_stage": 15,
}

def leadgen_discover_companies(icp: dict, count: int = 5) -> list[dict]:
    """Suggest real companies matching the ICP via LLM."""
    industries = ", ".join(icp.get("target_industries", ["Technology"]))
    product = icp.get("product", "software")
    prompt = "Suggest {} REAL companies matching this ICP: Target industries: {}, Product: {}. Return ONLY a JSON array: [{{ \"name\": \"...\", \"domain\": \"...\" }}]".format(count, industries, product)
    try:
        res = groq_client.invoke(prompt).content
        # Simple extraction of JSON from text
        match = re.search(r'\[.*\]', res, re.DOTALL)
        if match:
            return json.loads(match.group())
        return []
    except Exception as e:
        print(f"Discovery error: {e}")
        return []

def leadgen_scrape_company(domain: str) -> str:
    """Simplified scraper to get text from a domain."""
    url = f"https://{domain}"
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            for s in soup(['script', 'style']): s.decompose()
            return soup.get_text()[:4000]
        return ""
    except:
        return ""

def leadgen_extract_signals(text: str) -> dict:
    """Extract signals using LLM."""
    prompt = "Extract business signals from this text: {}. Return JSON: {{ \"industry\": \"...\", \"company_size\": \"...\", \"growth_signal\": \"high|medium|low\", \"hiring_intent\": true|false, \"funding_stage\": \"...\" }}".format(text[:2000])
    try:
        res = groq_client.invoke(prompt).content
        match = re.search(r'\{.*\}', res, re.DOTALL)
        return json.loads(match.group()) if match else {}
    except:
        return {}

def leadgen_score_lead(signals: dict, icp: dict) -> int:
    """Score the lead based on extracted signals."""
    score = 0
    # Add simplified scoring logic
    if any(ind.lower() in signals.get("industry", "").lower() for ind in icp["target_industries"]):
        score += LEADGEN_SCORING_WEIGHTS["industry"]
    if signals.get("growth_signal") == "high": score += LEADGEN_SCORING_WEIGHTS["growth_signal"]
    if signals.get("hiring_intent"): score += LEADGEN_SCORING_WEIGHTS["hiring_intent"]
    # ... more logic as needed
    return score

leadgen_router = APIRouter(prefix="/api/leadgen", tags=["leadgen"])

class LeadGenReq(BaseModel):
    product: str
    target_industries: list[str]

@leadgen_router.post("/run")
def run_leadgen_api(req: LeadGenReq):
    icp = {"product": req.product, "target_industries": req.target_industries}
    companies = leadgen_discover_companies(icp)
    results = []
    
    for comp in companies:
        domain = comp.get("domain")
        text = leadgen_scrape_company(domain)
        signals = leadgen_extract_signals(text)
        score = leadgen_score_lead(signals, icp)
        results.append({
            "company": comp.get("name"), 
            "domain": domain, 
            "score": score, 
            "signals": signals
        })
        
    return {"success": True, "results": results}

# ============================================================================
# FASTAPI APP ASSEMBLY
# ============================================================================
def create_app(routers: list) -> FastAPI:
    app = FastAPI(title=Config.APP_NAME, version=Config.APP_VERSION)
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
    
    @app.middleware("http")
    async def log_errors(request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            logger.error(f"FATAL ERROR: {str(e)}", exc_info=True)
            return JSONResponse(status_code=500, content={"detail": "Internal Server Error", "error": str(e)})

    for r in routers: 
        app.include_router(r)
    @app.get("/")
    def health_check(): 
        return {"status": "ok", "app": Config.APP_NAME}
    return app

full_api_app = create_app([pitch_router, pitchlab_router, linkedin_router, leadgen_router])
shark_api_app = create_app([pitchlab_router])
pitch_api_app = create_app([pitch_router])

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Starting {Config.APP_NAME} on http://0.0.0.0:{port}")
    uvicorn.run(full_api_app, host="0.0.0.0", port=port)
