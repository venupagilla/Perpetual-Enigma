import json
from typing import TypedDict
from langgraph.graph import StateGraph, END

# --- SETUP LLM (Placeholder) ---
# Since "llm" is used in the nodes but not defined in the snippet,
# here is a placeholder. You can replace this with your actual LLM instance
# --- SETUP LLM ---
import os
import json
import requests
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

# Initialize Gemini 2.5 Flash
_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)

class JsonParsingLLMWrapper:
    def invoke(self, prompt: str) -> dict:
        response = _llm.invoke(prompt)
        content = response.content.strip()
        # Remove markdown codeblock backticks if present
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        try:
            return json.loads(content.strip())
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON: {content}")
            return {"error": "JSON parse failed", "raw_content": content}

llm = JsonParsingLLMWrapper()
# -------------------------------

# STEP 1 — Minimal State
class GraphState(TypedDict):
    chat_history: list # To keep the conversation context
    user_input: str
    intent: str
    context: dict
    response: dict
    post_draft: dict
    user_feedback: str
    approval_status: str  # "pending", "approved"
    webhook_response: dict # Store the response from the Make/n8n webhook

# STEP 2 — Hardcoded Business Context (Temporary)
HARDCODED_CONTEXT = {
    "company_name": "MarketAI",
    "industry": "SaaS",
    "product": "AI-powered marketing assistant",
    "default_target": "Startup founders and small businesses",
    "default_tone": "Professional and engaging"
}

# STEP 3a — Conversational Node 
def chat_node(state: GraphState):
    # This node acts as a normal chatbot
    history = state.get("chat_history", [])
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
    
    prompt = f"""
You are a helpful and intelligent marketing assistant AI. 

You chat with the user normally. However, you also have the ability to trigger a "campaign_generation" or "post_generation" workflow if the user explicitly asks for either.

=================
CURRENT BUSINESS CONTEXT
=================
{json.dumps(state.get('context', {}), indent=2)}

=================
CHAT HISTORY
=================
{history_text}

=================
USER MESSAGE
=================
{state['user_input']}

=================
INSTRUCTIONS
=================
Determine if the user's message is:
1. "chat" - A general question or greeting that you should just answer directly.
2. "campaign_generation" - The user explicitly asks you to create a marketing campaign strategy.
3. "post_generation" - The user explicitly asks you to generate a social media post based on the context.

If it is "chat", provide a friendly, helpful conversational response.
If it is an action ("campaign_generation" or "post_generation"), simply acknowledge the request briefly and confirm you are starting that process. 

Return ONLY JSON in this exact structure:
{{
  "route_decision": "chat" | "campaign_generation" | "post_generation",
  "assistant_reply": "Your conversational response here"
}}
"""
    result = llm.invoke(prompt)
    
    # Update the chat history
    new_history = list(history)
    new_history.append({"role": "user", "content": state["user_input"]})
    
    reply = result.get("assistant_reply", "I'm not sure how to respond to that.")
    new_history.append({"role": "assistant", "content": reply})
    
    return {
        "chat_history": new_history,
        "intent": result.get("route_decision", "chat"),
        "response": {"chat_reply": reply} # Store the reply for the front-end to print
    }


# STEP 3b — Intent Classifier Node (Basic Prompt)
def intent_node(state: GraphState):
    prompt = f"""
You are an intent classifier.

Classify the user request into one of:

- campaign_generation
- post_generation
- unknown

Return ONLY JSON:
{{ "intent": "value" }}

User input:
{state['user_input']}
"""

    result = llm.invoke(prompt)

    return {
        "intent": result.get("intent", "unknown") if isinstance(result, dict) else "unknown",
        "context": HARDCODED_CONTEXT
    }

# STEP 4 — Campaign Node (Structured Version)
def campaign_node(state: GraphState):
    context = state["context"]

    prompt = f"""
You are a senior marketing strategist with expertise in digital campaigns, audience targeting, and platform optimization.

Your task is to generate a structured marketing campaign strategy based on the business context and user request.

========================
BUSINESS CONTEXT
========================
Company Name: {context.get('company_name', '')}
Industry: {context.get('industry', '')}
Product: {context.get('product', '')}
Default Target Audience: {context.get('default_target', '')}
Brand Tone: {context.get('default_tone', '')}

========================
USER REQUEST
========================
{state['user_input']}

========================
INSTRUCTIONS
========================
1. Clearly define the campaign objective.
2. Identify the ideal target audience (demographics + behavior).
3. Recommend the most suitable social media platforms and explain why.
4. Define the key messaging angle.
5. Suggest 3 content themes for posts.
6. Define the primary call-to-action.
7. Suggest whether this should be awareness, engagement, or conversion focused.

Think strategically. Do NOT generate actual posts. Only generate the campaign strategy.

========================
OUTPUT FORMAT
========================
Return ONLY valid JSON in this structure:

{{
  "campaign_objective": "",
  "campaign_type": "",
  "target_audience": {{
    "description": "",
    "demographics": "",
    "behavioral_traits": ""
  }},
  "recommended_platforms": [
    {{
      "platform": "",
      "reason": ""
    }}
  ],
  "key_message_angle": "",
  "content_themes": [],
  "primary_cta": ""
}}
"""

    result = llm.invoke(prompt)

    return {"response": result}

# STEP 5 — Post Node (Initial Draft)
def post_node(state: GraphState):
    context = state["context"]
    
    # Extract conversational context if they talked about a campaign beforehand
    history = state.get("chat_history", [])
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history[-5:]]) # Keep last 5 messages for recency

    prompt = f"""
You are an expert social media content strategist crafting a highly targeted post.

========================
CRITICAL BUSINESS CONTEXT
========================
You must firmly root your post in this brand identity:
Company Name: {context.get('company_name', '')}
Industry: {context.get('industry', '')}
Product/Service: {context.get('product', '')}
Ideal Target Audience: {context.get('default_target', '')}
Required Brand Tone: {context.get('default_tone', '')}

========================
RECENT CONVERSATION HISTORY
========================
(Use this to understand precisely what the user has asked for regarding the post angle or strategy previously discussed):
{history_text}

========================
LATEST USER REQUEST
========================
{state.get('user_input', '')}

========================
INSTRUCTIONS
========================
The user wants a highly tailored, engaging social media post based on their latest request and the conversational context above.
Note: the actual posting to social platforms will be handled by an external n8n workflow later. Your job here is purely creative strategy and text generation.

1. Review the CRITICAL BUSINESS CONTEXT. The post MUST sound like it comes from "{context.get('company_name', '')}" and MUST appeal to "{context.get('default_target', '')}".
2. Review the RECENT CONVERSATION HISTORY to catch any nuances, strategies, or specific campaign directions the user might have mentioned right before asking for the post.
3. Determine the best platform organically based on the request (if not explicitly stated).
4. Generate platform-optimized content that perfectly matches the `Required Brand Tone`.
5. Keep content engaging, valuable to the audience, and concise.
6. Add a compelling Call-To-Action (CTA) that logically leads back to the `Product/Service`.
7. If Instagram → include visually descriptive cues and hashtags.
8. If LinkedIn → use a structured professional format with ample whitespace.
9. If X (Twitter) → keep it short, punchy, and under 280 characters.

Return ONLY valid JSON in this structure:

{{
  "platform": "",
  "post_text": "",
  "hashtags": [],
  "cta": "",
  "tone": "",
  "target_audience_focus": "",
  "context_used": "Briefly describe how you incorporated the business context into this post."
}}
"""

    result = llm.invoke(prompt)

    # Note: we store in `post_draft` and set `approval_status`
    return {
        "post_draft": result,
        "approval_status": "pending"
    }

# STEP 5b — Human Review Node (Interrupt)
def human_review_node(state: GraphState):
    # This node doesn't strictly *need* to do anything but serve as a break point.
    # The actual pause happens via `interrupt_before` or `interrupt_after` on the graph compilation.
    pass

# STEP 5c — Refinement Node
def refinement_node(state: GraphState):
    context = state["context"]
    previous_draft = json.dumps(state.get("post_draft", {}), indent=2)
    feedback = state.get("user_feedback", "")

    prompt = f"""
You are refining a social media post based on user feedback.

========================
BUSINESS CONTEXT
========================
Company Name: {context.get('company_name', '')}
Industry: {context.get('industry', '')}
Product: {context.get('product', '')}
Brand Tone: {context.get('default_tone', '')}

========================
PREVIOUS POST DRAFT
========================
{previous_draft}

========================
USER FEEDBACK
========================
{feedback}

========================
INSTRUCTIONS
========================
1. Modify the post strongly according to user feedback.
2. Preserve the relevant good parts of the previous draft.
3. Improve clarity and engagement.
4. Maintain platform optimization.
5. Keep the strictly structured JSON format.

Return ONLY valid JSON:

{{
  "platform": "",
  "post_text": "",
  "hashtags": [],
  "cta": "",
  "tone": "",
  "target_audience_focus": ""
}}
"""

    result = llm.invoke(prompt)

    return {
        "post_draft": result,
        "approval_status": "pending"  # Wait for approval again
    }

# STEP 5d — Webhook Trigger Node (n8n / Make)
def webhook_node(state: GraphState):
    context = state["context"]
    draft = state.get("post_draft", {})
    user_input = state.get("user_input", "")

    # Format the payload to exactly match the target Make/n8n schema
    payload = {
      "campaign": {
        "topic": context.get("product", "Generated Campaign"),
        "platform": draft.get("platform", "linkedin"),
        "post_type": "insight_post" # Or dynamically generated if added to prompt later
      },
      "context": {
        "background": f"{context.get('company_name', '')} is in the {context.get('industry', '')} space.",
        "current_trend": draft.get("context_used", ""),
        "target_audience": draft.get("target_audience_focus", context.get('default_target', ''))
      },
      "user_intent": {
        "goal": user_input,
        "tone": draft.get("tone", context.get('default_tone', '')),
        "cta": draft.get("cta", "")
      },
      "generation_rules": {
        "max_length": 700,
        "include_hook": True,
        "include_emojis": True,
        "include_hashtags": True,
        "hashtags_count": len(draft.get("hashtags", []))
      },
      # Including the actual generated post content since it was approved
      "approved_content": { 
          "post_text": draft.get("post_text", ""),
          "hashtags": draft.get("hashtags", [])
      }
    }

    # Fetch webhook details from environment (or use the hardcoded one provided by user for now)
    webhook_url = os.getenv("WEBHOOK_URL", "https://hook.eu2.make.com/q7gpp2ii4d9c1vw5qlpwz1a4ps55g27q")
    webhook_api_key = os.getenv("WEBHOOK_API_KEY", "j6G3JDCs-n.mw2n")

    headers = {
        "Content-Type": "application/json",
        "x-make-apikey": webhook_api_key
    }

    try:
        print("\n[Triggering Webhook...]")
        response = requests.post(webhook_url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        webhook_result = {"status": "success", "status_code": response.status_code, "payload_sent": payload}
    except requests.exceptions.RequestException as e:
        webhook_result = {"status": "error", "error_message": str(e), "payload_attempted": payload}
        print(f"\n[Webhook Failed]: {e}")

    return {"webhook_response": webhook_result}


# STEP 6 — Routing Functions
def route_from_chat(state: GraphState):
    intent = state.get("intent", "chat")
    if intent == "campaign_generation":
        return "campaign_node"
    elif intent == "post_generation":
        return "post_node"
    else:
        return END # It was just a chat message, so we stop here.

def route_intent(state: GraphState):
    # (Kept for backwards compatibility if needed, though chat_node now sets intent directly)
    if state.get("intent") == "campaign_generation":
        return "campaign_node"
    elif state.get("intent") == "post_generation":
        return "post_node"
    else:
        return END

def route_review(state: GraphState):
    if state.get("approval_status") == "approved":
        # Route to webhook after human approval
        return "webhook_node"
    else:
        return "refinement_node"

# STEP 7 — Build the Basic Graph
from langgraph.checkpoint.memory import MemorySaver

builder = StateGraph(GraphState)

builder.add_node("chat_node", chat_node)
builder.add_node("intent_node", intent_node) # Technically bypassed now by chat_node
builder.add_node("campaign_node", campaign_node)

builder.add_node("post_node", post_node)
builder.add_node("human_review_node", human_review_node)
builder.add_node("refinement_node", refinement_node)
builder.add_node("webhook_node", webhook_node)

builder.set_entry_point("chat_node")

# Chat Routing
builder.add_conditional_edges(
    "chat_node",
    route_from_chat
)

# Intent Routing (Fallback)
builder.add_conditional_edges(
    "intent_node",
    route_intent
)

builder.add_edge("campaign_node", END)

# Post Generation Cycle
builder.add_edge("post_node", "human_review_node")

# Review Routing
builder.add_conditional_edges(
    "human_review_node",
    route_review
)

# Loop back to review after refinement
builder.add_edge("refinement_node", "human_review_node")

# Webhook triggers then ends
builder.add_edge("webhook_node", END)

# Add Memory (Required for interrupts)
memory = MemorySaver()

# We pause the graph execution BEFORE it hits the `human_review_node` 
# allowing the user to view `state["post_draft"]` and provide `state["user_feedback"]` and `state["approval_status"]`
graph = builder.compile(
    checkpointer=memory,
    interrupt_before=["human_review_node"]
)

# STEP 8 — Running It & Simulating Interactive Chat
if __name__ == "__main__":
    import uuid
    thread_config = {"configurable": {"thread_id": str(uuid.uuid4())}}

    print("\n" + "="*50)
    print("🤖 MarketAI Assistant Pipeline Initiated")
    print("Type 'exit' or 'quit' to stop.")
    print("="*50)
    
    # Pre-load context to not have to deal with missing keys
    graph.update_state(thread_config, {"context": HARDCODED_CONTEXT})

    while True:
        user_msg = input("\nYou: ").strip()
        if user_msg.lower() in ['exit', 'quit']:
            break
            
        if not user_msg:
            continue

        initial_input = {"user_input": user_msg}
        
        # Stream the graph logic
        for event in graph.stream(initial_input, config=thread_config, stream_mode="values"):
            pass
            
        current_state = graph.get_state(thread_config).values
        
        # 1. Did it just chat?
        if current_state.get("intent") == "chat":
            print(f"\nAssistant: {current_state.get('response', {}).get('chat_reply', '')}")
            continue
            
        # 2. Did it generate a campaign?
        elif current_state.get("intent") == "campaign_generation":
            print(f"\nAssistant: {current_state.get('response', {}).get('chat_reply', '')}")
            print("\n--- [CAMPAIGN STRATEGY GENERATED] ---")
            print(json.dumps(current_state.get("response", {}).get("response", {}), indent=2))
            continue
            
        # 3. Did it generate a post? (Hits the Human Review Loop)
        elif current_state.get("intent") == "post_generation":
             print(f"\nAssistant: {current_state.get('response', {}).get('chat_reply', '')}")
             while True:
                state_now = graph.get_state(thread_config).values
                draft = state_now.get("post_draft", {})
                
                print("\n" + "="*50)
                print("--- [HUMAN REVIEW NEEDED] ---")
                print("CURRENT POST DRAFT:")
                print(json.dumps(draft, indent=2))
                print("="*50)
                
                decision = input("\nIs this post approved? (Type 'y' to approve, or type your feedback to refine it):\n> ").strip()

                if decision.lower() == 'y':
                    print("\n--- [APPROVING POST...] ---")
                    graph.update_state(
                        thread_config,
                        {"approval_status": "approved"},
                        as_node="human_review_node"
                    )
                    # Finish the route (which will now hit webhook_node then END)
                    for _ in graph.stream(None, config=thread_config, stream_mode="values"): pass
                    
                    final_state = graph.get_state(thread_config).values
                    webhook_results = final_state.get("webhook_response", {})
                    
                    print("\n[Webhook Trigger Output]")
                    if webhook_results.get("status") == "success":
                        print("✅ Successfully triggered Make/n8n webhook!")
                        print(f"Status Code: {webhook_results.get('status_code')}")
                        print("Payload Sent:")
                        print(json.dumps(webhook_results.get('payload_sent'), indent=2))
                    else:
                        print("❌ Webhook failed to trigger.")
                        print(f"Error: {webhook_results.get('error_message')}")
                    break
                else:
                    print("\n--- [REFINING POST BASED ON FEEDBACK...] ---")
                    graph.update_state(
                        thread_config,
                        {"user_feedback": decision, "approval_status": "pending"},
                        as_node="human_review_node"
                    )
                    # Route to refinement_node and back to human_review_node
                    for _ in graph.stream(None, config=thread_config, stream_mode="values"): pass

