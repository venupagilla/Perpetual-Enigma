"""
Sales Pitch AI Assistant - Consolidated Backend Application
A production-ready AI-powered web application for generating structured sales pitches 
and handling customer Q&A using FastAPI, LangChain, and Groq API.
"""

import logging
import json
import os
from contextlib import asynccontextmanager
from typing import Dict, Any, Literal
from dotenv import load_dotenv
from fastapi import FastAPI, Request, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ============================================================================
# CONFIGURATION
# ============================================================================

class Config:
    """Application configuration from environment variables."""
    
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "2048"))
    APP_NAME: str = "Sales Pitch AI Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    @classmethod
    def validate(cls) -> None:
        """Validate that all required environment variables are set."""
        if not cls.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY environment variable is not set")


# Validate config on import
Config.validate()


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class PitchRequest(BaseModel):
    """Request model for pitch generation."""
    product: str = Field(..., description="Product or service to pitch", min_length=1, max_length=500)
    audience: Literal["investor", "customer", "b2b", "partner"] = Field(
        ..., 
        description="Target audience for the pitch"
    )
    time_limit: Literal["30s", "60s", "120s"] = Field(
        ..., 
        description="Duration of the pitch"
    )
    tone: Literal["confident", "casual", "aggressive", "enthusiastic", "professional", "friendly", "urgent", "empathetic", "authoritative"] = Field(
        ..., 
        description="Tone of the pitch"
    )
    language: Literal["english", "hinglish", "hindi"] = Field(
        default="english",
        description="Language for the pitch (English, Hinglish, or Hindi)"
    )


class PitchOutput(BaseModel):
    """Structured output for a sales pitch."""
    script: str = Field(..., description="Full pitch script in paragraph format")
    format_style: str = Field(default="", description="The format style used for this pitch")


class PitchResponse(BaseModel):
    """Response model for pitch generation."""
    success: bool = Field(default=True, description="Whether the pitch was generated successfully")
    pitch: PitchOutput = Field(..., description="Generated pitch")
    message: str = Field(default="Pitch generated successfully", description="Status message")


class ChatRequest(BaseModel):
    """Request model for chat."""
    question: str = Field(..., description="User question", min_length=1, max_length=1000)
    context: str = Field(
        default="", 
        description="Context about the product or service", 
        max_length=2000
    )


class ChatResponse(BaseModel):
    """Response model for chat."""
    success: bool = Field(default=True, description="Whether the request was successful")
    answer: str = Field(..., description="Salesperson's answer to the question")
    message: str = Field(default="Answer provided successfully", description="Status message")


class PitchFeedbackRequest(BaseModel):
    """Request model for pitch feedback."""
    accepted: bool = Field(..., description="Whether the pitch was accepted or rejected")
    pitch_id: str = Field(default="", description="Optional identifier for the pitch")


class PitchAssessmentResponse(BaseModel):
    """Response model for pitch assessment statistics."""
    success: bool = Field(default=True, description="Whether the request was successful")
    total_pitches: int = Field(..., description="Total number of pitches generated")
    accepted: int = Field(..., description="Number of pitches accepted")
    rejected: int = Field(..., description="Number of pitches rejected")
    acceptance_rate: float = Field(..., description="Percentage of pitches accepted")
    message: str = Field(default="Assessment retrieved successfully", description="Status message")


class PitchRegenerateRequest(BaseModel):
    """Request model for pitch regeneration with feedback."""
    product: str = Field(..., description="Product or service to pitch", min_length=1, max_length=500)
    audience: Literal["investor", "customer", "b2b", "partner"] = Field(..., description="Target audience for the pitch")
    time_limit: Literal["30s", "60s", "120s"] = Field(..., description="Duration of the pitch")
    tone: Literal["confident", "casual", "aggressive", "enthusiastic", "professional", "friendly", "urgent", "empathetic", "authoritative"] = Field(..., description="Tone of the pitch")
    language: Literal["english", "hinglish", "hindi"] = Field(
        default="english",
        description="Language for the pitch (English, Hinglish, or Hindi)"
    )
    previous_pitch: str = Field(..., description="The previous pitch that was rejected")
    user_feedback: str = Field(default="", description="Specific feedback from user about what to change", max_length=1000)
    excluded_formats: list[str] = Field(default=[], description="Formats to exclude from regeneration")


# ============================================================================
# PITCH ASSESSMENT TRACKER
# ============================================================================

class PitchAssessmentTracker:
    """Track pitch acceptance and rejection statistics."""
    
    def __init__(self):
        """Initialize the tracker with zero statistics."""
        self.total_pitches = 0
        self.accepted = 0
        self.rejected = 0
    
    def record_feedback(self, accepted: bool):
        """Record pitch feedback.
        
        Args:
            accepted: True if pitch was accepted, False if rejected
        """
        self.total_pitches += 1
        if accepted:
            self.accepted += 1
        else:
            self.rejected += 1
        logger.info(f"Pitch feedback recorded: {'accepted' if accepted else 'rejected'}. Total: {self.total_pitches}")
    
    def get_statistics(self) -> dict:
        """Get current assessment statistics.
        
        Returns:
            dict: Statistics with total, accepted, rejected, and acceptance_rate
        """
        acceptance_rate = (self.accepted / self.total_pitches * 100) if self.total_pitches > 0 else 0.0
        return {
            "total_pitches": self.total_pitches,
            "accepted": self.accepted,
            "rejected": self.rejected,
            "acceptance_rate": round(acceptance_rate, 2)
        }


# Global assessment tracker instance
_assessment_tracker = PitchAssessmentTracker()


def get_assessment_tracker() -> PitchAssessmentTracker:
    """Get the global assessment tracker instance.
    
    Returns:
        PitchAssessmentTracker: Singleton instance of tracker
    """
    return _assessment_tracker


# ============================================================================
# LLM SERVICE
# ============================================================================

class LLMService:
    """Wrapper service around ChatGroq for consistent LLM interactions."""

    def __init__(self):
        """Initialize the LLM service with Groq configuration."""
        self.model = ChatGroq(
            model=Config.LLM_MODEL,
            temperature=Config.LLM_TEMPERATURE,
            api_key=Config.GROQ_API_KEY,
            max_tokens=Config.LLM_MAX_TOKENS,
        )
        logger.info(f"LLMService initialized with model: {Config.LLM_MODEL}")

    async def generate_text(
        self,
        prompt: ChatPromptTemplate,
        **input_vars
    ) -> str:
        """Generate plain text output from the model.
        
        Args:
            prompt: LangChain chat prompt template
            **input_vars: Input variables for the prompt
            
        Returns:
            str: Generated text response
            
        Raises:
            Exception: If generation fails
        """
        try:
            chain = prompt | self.model
            response = await chain.ainvoke(input_vars)
            
            # Extract content from AIMessage
            content = response.content if hasattr(response, 'content') else str(response)
            logger.info("Successfully generated text output")
            return content
            
        except Exception as e:
            logger.error(f"Error in generate_text: {str(e)}")
            raise

    async def generate_json(
        self,
        prompt: PromptTemplate,
        **input_vars
    ) -> Dict[str, Any]:
        """Generate JSON output from the model.
        
        Args:
            prompt: LangChain prompt template
            **input_vars: Input variables for the prompt
            
        Returns:
            Dict[str, Any]: Parsed JSON response
            
        Raises:
            ValueError: If JSON parsing fails
        """
        try:
            chain = prompt | self.model
            response = await chain.ainvoke(input_vars)
            
            # Extract content from AIMessage
            content = response.content if hasattr(response, 'content') else str(response)
            
            # Parse JSON from response
            json_data = json.loads(content)
            logger.info("Successfully generated JSON output")
            return json_data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            raise ValueError(f"Failed to parse model response as JSON: {str(e)}")
        except Exception as e:
            logger.error(f"Error in generate_json: {str(e)}")
            raise


# Global LLM service instance
_llm_service: LLMService = None


def get_llm_service() -> LLMService:
    """Get or create the global LLM service instance.
    
    Returns:
        LLMService: Singleton instance of LLMService
    """
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


# ============================================================================
# PROMPT BUILDER
# ============================================================================

class PromptBuilder:
    """Reusable prompt builder for various tasks."""

    @staticmethod
    def get_pitch_formats() -> dict:
        """Get different pitch format templates.
        
        Returns:
            dict: Dictionary of pitch format templates
        """
        return {
            "problem_solution": "Start by highlighting a critical problem {audience_pain_point}, then present your solution as the answer, and conclude with the transformation it brings.",
            "story_based": "Begin with a relatable story or scenario that your audience can connect with, weave in how your product fits naturally into that narrative, and end with an inspiring vision of success.",
            "question_led": "Open with thought-provoking questions that make your audience reflect on their challenges, guide them through the answers that lead to your solution, and close with a compelling invitation.",
            "data_driven": "Lead with powerful statistics or market insights, build credibility with facts and figures, demonstrate your proven results, and finish with a logical next step.",
            "bold_statement": "Make a bold, attention-grabbing claim about what your product can do, back it up with compelling evidence and benefits, and create urgency for action.",
            "consultative": "Position yourself as a trusted advisor who understands their situation deeply, demonstrate expertise through insights, and guide them toward the best solution naturally."
        }

    @staticmethod
    def get_pitch_prompt() -> PromptTemplate:
        """Build a prompt for sales pitch generation.
        
        Returns:
            PromptTemplate: A LangChain prompt template for pitch generation
        """
        template = """You are an elite sales pitch writer and keynote speaker. Create a compelling, persuasive sales pitch script for the following:

Product/Service: {product}
Target Audience: {audience}
Pitch Duration: {duration}
Word Count Target: {word_count}
Tone: {tone}
Pitch Format Style: {format_style}
Language: {language}

AUDIENCE-SPECIFIC FOCUS:
{audience_context}

STRICT LENGTH REQUIREMENT:
Your pitch MUST be approximately {word_count} words. This is critical - the pitch length should match the time limit exactly. {length_guidance}

FORMAT APPROACH:
{format_instruction}

TONE GUIDANCE:
{tone_guidance}

LANGUAGE INSTRUCTION:
{language_instruction}

Write the pitch as a natural, flowing script - as if a top salesperson is delivering it with genuine {tone} energy. Make it engaging, persuasive, and authentic. The pitch should feel like a real conversation, not a robotic recitation.

Include natural transitions between ideas, use specific examples where appropriate, and weave in credibility markers that resonate with {audience}.

Write ONLY the pitch script itself, nothing else. No JSON, no labels, no meta-commentary, no introductions like "Here's your pitch". Just the pure pitch script."""

        return PromptTemplate(
            input_variables=["product", "audience", "tone", "duration", "word_count", "length_guidance", "audience_context", "format_style", "format_instruction", "tone_guidance", "language", "language_instruction"],
            template=template
        )
    
    @staticmethod
    def get_pitch_regenerate_prompt() -> PromptTemplate:
        """Build a prompt for regenerating a pitch based on user feedback.
        
        Returns:
            PromptTemplate: A LangChain prompt template for pitch regeneration
        """
        template = """You are an elite sales pitch writer and keynote speaker. The user has reviewed your previous pitch and wants improvements.

Product/Service: {product}
Target Audience: {audience}
Pitch Duration: {duration}
Word Count Target: {word_count}
Tone: {tone}
Pitch Format Style: {format_style}
Language: {language}

PREVIOUS PITCH (that the user is not satisfied with):
{previous_pitch}

USER FEEDBACK:
{user_feedback}

AUDIENCE-SPECIFIC FOCUS:
{audience_context}

STRICT LENGTH REQUIREMENT:
Your pitch MUST be approximately {word_count} words. This is critical - the pitch length should match the time limit exactly. {length_guidance}

FORMAT APPROACH:
{format_instruction}

TONE GUIDANCE:
{tone_guidance}

LANGUAGE INSTRUCTION:
{language_instruction}

IMPORTANT INSTRUCTIONS:
- Address the user's feedback directly and make the requested improvements
- If the user provided specific feedback, incorporate those suggestions carefully
- If no specific feedback was provided, create a significantly different version using the {format_style} approach
- Ensure the new pitch is distinct from the previous one while maintaining quality
- Keep the same tone ({tone}) and target the same audience ({audience})

Write the pitch as a natural, flowing script - as if a top salesperson is delivering it with genuine {tone} energy. Make it engaging, persuasive, and authentic.

Write ONLY the improved pitch script itself, nothing else. No JSON, no labels, no meta-commentary. Just the pure pitch script."""

        return PromptTemplate(
            input_variables=["product", "audience", "tone", "duration", "word_count", "length_guidance", "audience_context", "format_style", "format_instruction", "tone_guidance", "previous_pitch", "user_feedback", "language", "language_instruction"],
            template=template
        )

    @staticmethod
    def get_chat_prompt() -> ChatPromptTemplate:
        """Build a chat prompt for Q&A interactions.
        
        Returns:
            ChatPromptTemplate: A LangChain chat prompt template for Q&A
        """
        system_message = """You are a top 1% salesperson who closes deals efficiently. Your approach:
- Answer concisely and persuasively
- Use logical reasoning and data points when available
- If you don't know something, provide reasonable assumptions based on industry knowledge
- Be professional but personable
- Address objections proactively
- Always tie the answer back to value and benefits
- Keep responses under 150 words unless specifically asked for more detail"""

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_message),
            ("human", """Context about the product/service:
{context}

Customer Question: {question}

Provide a persuasive, concise answer that addresses the question directly and moves the conversation toward a sale.""")
        ])

        return prompt_template

    @staticmethod
    def get_time_limit_config(time_limit: Literal["30s", "60s", "120s"]) -> dict:
        """Get word limit and other config based on time limit.
        
        Args:
            time_limit: Time duration for the pitch
            
        Returns:
            dict: Configuration with word_limit and other parameters
        """
        config_map = {
            "30s": {
                "word_count": "70-85 words",
                "max_tokens": 350,
                "description": "30 second elevator pitch",
                "guidance": "Keep it punchy and focused. Hit only the most critical points - problem, solution, and one key benefit. Every word counts."
            },
            "60s": {
                "word_count": "140-160 words",
                "max_tokens": 650,
                "description": "60 second standard pitch",
                "guidance": "You have room to breathe. Cover problem, solution, key benefits, differentiation, and a call to action. Build momentum naturally."
            },
            "120s": {
                "word_count": "280-320 words",
                "max_tokens": 1200,
                "description": "120 second detailed pitch",
                "guidance": "This is your comprehensive pitch. Tell a complete story - set the scene, explore the pain points, showcase your solution in detail, provide social proof or data, paint the vision of success, and create urgency for action."
            }
        }
        return config_map.get(time_limit, config_map["60s"])

    @staticmethod
    def get_audience_context(audience: Literal["investor", "customer", "b2b", "partner"]) -> str:
        """Get context description based on audience type.
        
        Args:
            audience: Type of audience
            
        Returns:
            str: Context description for the audience
        """
        audience_map = {
            "investor": """INVESTORS care about:
- Market size and growth potential (TAM/SAM/SOM)
- Competitive moat and defensibility
- Scalability and unit economics
- Team expertise and execution capability
- ROI timeline and exit strategy
- Traction, metrics, and momentum
Speak their language: use terms like market opportunity, competitive advantage, hockey stick growth, and path to profitability.""",
            "customer": """CUSTOMERS care about:
- How it solves their specific pain points immediately
- Ease of use and learning curve
- Price/value relationship and budget fit
- Customer support and reliability
- Trust, reviews, and social proof
- Quick wins and tangible results
Speak their language: focus on benefits over features, use relatable scenarios, address common objections preemptively.""",
            "b2b": """B2B BUYERS care about:
- Integration with existing systems and workflows
- Enterprise-grade security and compliance
- Scalability and multi-user capabilities
- TCO (Total Cost of Ownership) and ROI
- SLA, uptime guarantees, and dedicated support
- Implementation timeline and change management
- Vendor stability and long-term partnership
Speak their language: emphasize efficiency gains, reduced costs, risk mitigation, and strategic value.""",
            "partner": """POTENTIAL PARTNERS care about:
- Mutual value creation and win-win opportunities
- Aligned missions and complementary strengths
- Revenue sharing and growth potential
- Brand alignment and reputation
- Ease of integration and collaboration
- Clear roles, responsibilities, and benefits
Speak their language: focus on synergy, shared success, market expansion, and collaborative growth."""
        }
        return audience_map.get(audience, audience_map["customer"])
    
    @staticmethod
    def get_audience_pain_point(audience: Literal["investor", "customer", "b2b", "partner"]) -> str:
        """Get typical pain points for each audience type.
        
        Args:
            audience: Type of audience
            
        Returns:
            str: Pain point description
        """
        pain_map = {
            "investor": "missing out on high-growth opportunities or backing solutions that lack market fit",
            "customer": "wasting time and money on solutions that don't deliver results or are too complex to use",
            "b2b": "dealing with inefficient processes, high costs, security risks, or solutions that don't scale",
            "partner": "struggling to find the right partners who share their vision and can drive meaningful growth together"
        }
        return pain_map.get(audience, pain_map["customer"])
    
    @staticmethod
    def get_tone_guidance(tone: str) -> str:
        """Get guidance for implementing different tones.
        
        Args:
            tone: The desired tone for the pitch
            
        Returns:
            str: Guidance on how to achieve that tone
        """
        tone_map = {
            "confident": "Be assertive and self-assured. Use strong, definitive language. Speak with authority and conviction. Express certainty about your solution's value.",
            "casual": "Keep it conversational and relaxed. Use friendly language, contractions, and a warm approach. Make it feel like a chat with a trusted friend.",
            "aggressive": "Be bold and direct. Challenge the status quo. Use powerful, action-oriented language. Create a sense of urgency and competition.",
            "enthusiastic": "Show genuine excitement and passion. Use energetic language and vivid imagery. Let your enthusiasm be contagious and inspiring.",
            "professional": "Maintain polished, business-appropriate language. Be respectful and articulate. Focus on credibility, facts, and logical flow.",
            "friendly": "Be warm, approachable, and personable. Use inclusive language ('we', 'us'). Show empathy and understanding.",
            "urgent": "Create a sense of immediacy and pressing need. Emphasize time-sensitivity and the cost of inaction. Use language that motivates quick decision-making.",
            "empathetic": "Show deep understanding of their struggles. Validate their feelings and challenges. Position yourself as someone who truly gets it and cares.",
            "authoritative": "Demonstrate expertise and industry knowledge. Use data, insights, and established principles. Be the trusted expert they need to listen to."
        }
        return tone_map.get(tone, tone_map["confident"])
    
    @staticmethod
    def get_language_instruction(language: str) -> str:
        """Get instruction for language style.
        
        Args:
            language: The desired language for the pitch (english or hinglish)
            
        Returns:
            str: Instruction on how to write in that language
        """
        language_map = {
            "english": "Write the pitch in clear, professional English. Use proper grammar and vocabulary appropriate for a business setting.",
            "hinglish": """Write the pitch in Hinglish - a natural mix of Hindi and English that is commonly used in India. Guidelines:
- Mix Hindi and English words naturally as people speak in everyday conversations
- Use Hindi words for common expressions, emotions, and cultural references (e.g., 'bahut achha', 'sahi hai', 'zaroor', 'bilkul')
- Use English for technical terms, business jargon, and modern concepts
- Write Hindi words in Roman script (Devanagari transliteration)
- Keep it conversational and relatable to Indian audiences
- Examples: 'Yeh product bahut useful hai', 'Aapke business ko grow karne mein help karega', 'Investment ka return guaranteed hai'
- Make it feel authentic and natural, not forced or artificial""",
            "hindi": """Write the pitch in pure Hindi written in Roman script (Devanagari transliteration). Guidelines:
- Write entirely in Hindi language using Roman/Latin alphabet
- Use proper Hindi grammar and sentence structure
- Keep vocabulary professional and appropriate for business context
- Use Hindi equivalents for business terms where available (e.g., 'vyapar' for business, 'upbhokta' for customer, 'nivesh' for investment)
- Write in a way that Hindi speakers can easily read and understand
- Examples: 'Yeh utpaad aapke vyapar ke liye bahut upyogi hai', 'Hamare samadhaan se aapko bahut laabh hoga', 'Nivesh par pratiphal pakka hai'
- Make it natural, professional, and culturally appropriate for Hindi-speaking audiences
- Ensure the pitch flows naturally in Hindi without mixing English words unless absolutely necessary for technical terms"""
        }
        return language_map.get(language, language_map["english"])


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for app startup and shutdown."""
    logger.info(f"Starting {Config.APP_NAME} v{Config.APP_VERSION}")
    yield
    logger.info(f"Shutting down {Config.APP_NAME}")


# Create FastAPI app
app = FastAPI(
    title=Config.APP_NAME,
    description="Production-ready AI-powered Sales Pitch Assistant",
    version=Config.APP_VERSION,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom exception handler
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions and return proper error responses."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error"}
    )


# ============================================================================
# API ROUTES
# ============================================================================

# Create router for API endpoints
router = APIRouter(prefix="/api/v1", tags=["api"])


@router.post("/generate-pitch", response_model=PitchResponse)
async def generate_pitch(request: PitchRequest) -> PitchResponse:
    """Generate a script-style sales pitch based on input parameters.
    
    Args:
        request: PitchRequest with product, audience, time_limit, and tone
        
    Returns:
        PitchResponse: Generated pitch script
        
    Raises:
        HTTPException: If pitch generation fails
    """
    try:
        logger.info(f"Generating pitch for product: {request.product}, audience: {request.audience}")
        
        # Get time limit configuration
        time_config = PromptBuilder.get_time_limit_config(request.time_limit)
        
        # Randomly select a pitch format for variety
        import random
        pitch_formats = PromptBuilder.get_pitch_formats()
        format_style = random.choice(list(pitch_formats.keys()))
        format_instruction = pitch_formats[format_style]
        
        logger.info(f"Selected pitch format: {format_style}")
        
        # Build the prompt
        base_prompt = PromptBuilder.get_pitch_prompt()
        
        # Create input variables with all contexts
        audience_context = PromptBuilder.get_audience_context(request.audience)
        audience_pain_point = PromptBuilder.get_audience_pain_point(request.audience)
        tone_guidance = PromptBuilder.get_tone_guidance(request.tone)
        language_instruction = PromptBuilder.get_language_instruction(request.language)
        
        input_vars = {
            "product": request.product,
            "audience": request.audience,
            "tone": request.tone,
            "duration": time_config["description"],
            "word_count": time_config["word_count"],
            "length_guidance": time_config["guidance"],
            "audience_context": audience_context,
            "audience_pain_point": audience_pain_point,
            "format_style": format_style.replace('_', ' ').title(),
            "format_instruction": format_instruction,
            "tone_guidance": tone_guidance,
            "language": request.language.title(),
            "language_instruction": language_instruction
        }
        
        # Get LLM service with custom max_tokens for this request
        llm_service = get_llm_service()
        
        # Temporarily override max_tokens for this specific generation
        original_max_tokens = llm_service.model.max_tokens
        llm_service.model.max_tokens = time_config["max_tokens"]
        
        try:
            # Generate pitch as plain text
            pitch_script = await llm_service.generate_text(base_prompt, **input_vars)
        finally:
            # Restore original max_tokens
            llm_service.model.max_tokens = original_max_tokens
        
        # Create PitchOutput with the script and format style
        pitch_output = PitchOutput(script=pitch_script, format_style=format_style)
        
        logger.info("Pitch generated successfully")
        return PitchResponse(
            success=True,
            pitch=pitch_output,
            message="Pitch generated successfully"
        )
        
    except ValueError as e:
        logger.error(f"Validation error in pitch generation: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Pitch generation failed: {str(e)}")
    except Exception as e:
        logger.error(f"Error generating pitch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/regenerate-pitch", response_model=PitchResponse)
async def regenerate_pitch(request: PitchRegenerateRequest) -> PitchResponse:
    """Regenerate a pitch based on user feedback.
    
    Args:
        request: PitchRegenerateRequest with product, audience, time_limit, tone, previous pitch, and user feedback
        
    Returns:
        PitchResponse: Regenerated pitch script
        
    Raises:
        HTTPException: If pitch regeneration fails
    """
    try:
        logger.info(f"Regenerating pitch based on user feedback")
        
        # Get time limit configuration
        time_config = PromptBuilder.get_time_limit_config(request.time_limit)
        
        # Select a pitch format (different from previous ones if possible)
        import random
        pitch_formats = PromptBuilder.get_pitch_formats()
        available_formats = [f for f in pitch_formats.keys() if f not in request.excluded_formats]
        
        # If all formats are excluded, use any format
        if not available_formats:
            available_formats = list(pitch_formats.keys())
        
        format_style = random.choice(available_formats)
        format_instruction = pitch_formats[format_style]
        
        logger.info(f"Selected pitch format for regeneration: {format_style}")
        
        # Build the regeneration prompt
        regen_prompt = PromptBuilder.get_pitch_regenerate_prompt()
        
        # Create input variables with all contexts
        audience_context = PromptBuilder.get_audience_context(request.audience)
        audience_pain_point = PromptBuilder.get_audience_pain_point(request.audience)
        tone_guidance = PromptBuilder.get_tone_guidance(request.tone)
        language_instruction = PromptBuilder.get_language_instruction(request.language)
        
        # Prepare user feedback message
        if request.user_feedback.strip():
            feedback_msg = request.user_feedback
        else:
            feedback_msg = "No specific feedback provided. Please create a significantly different version with a fresh approach and different structure."
        
        input_vars = {
            "product": request.product,
            "audience": request.audience,
            "tone": request.tone,
            "duration": time_config["description"],
            "word_count": time_config["word_count"],
            "length_guidance": time_config["guidance"],
            "audience_context": audience_context,
            "audience_pain_point": audience_pain_point,
            "format_style": format_style.replace('_', ' ').title(),
            "format_instruction": format_instruction,
            "tone_guidance": tone_guidance,
            "previous_pitch": request.previous_pitch,
            "user_feedback": feedback_msg,
            "language": request.language.title(),
            "language_instruction": language_instruction
        }
        
        # Get LLM service with custom max_tokens for this request
        llm_service = get_llm_service()
        
        # Temporarily override max_tokens for this specific generation
        original_max_tokens = llm_service.model.max_tokens
        llm_service.model.max_tokens = time_config["max_tokens"]
        
        try:
            # Generate pitch as plain text
            pitch_script = await llm_service.generate_text(regen_prompt, **input_vars)
        finally:
            # Restore original max_tokens
            llm_service.model.max_tokens = original_max_tokens
        
        # Create PitchOutput with the script and format style
        pitch_output = PitchOutput(script=pitch_script, format_style=format_style)
        
        logger.info("Pitch regenerated successfully")
        return PitchResponse(
            success=True,
            pitch=pitch_output,
            message="Pitch regenerated based on your feedback"
        )
        
    except ValueError as e:
        logger.error(f"Validation error in pitch regeneration: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Pitch regeneration failed: {str(e)}")
    except Exception as e:
        logger.error(f"Error regenerating pitch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Answer questions like a trained salesperson.
    
    Args:
        request: ChatRequest with question and optional context
        
    Returns:
        ChatResponse: Salesperson's answer to the question
        
    Raises:
        HTTPException: If answer generation fails
    """
    try:
        logger.info(f"Processing chat request: {request.question[:100]}...")
        
        # Get chat prompt
        chat_prompt = PromptBuilder.get_chat_prompt()
        
        # Prepare input variables
        context = request.context if request.context else "No specific product context provided."
        
        input_vars = {
            "context": context,
            "question": request.question
        }
        
        # Get LLM service
        llm_service = get_llm_service()
        
        # Generate answer
        answer = await llm_service.generate_text(chat_prompt, **input_vars)
        
        logger.info("Chat answer generated successfully")
        return ChatResponse(
            success=True,
            answer=answer,
            message="Answer provided successfully"
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")


@router.post("/pitch-feedback")
async def pitch_feedback(request: PitchFeedbackRequest):
    """Record feedback on a pitch (accepted or rejected).
    
    Args:
        request: PitchFeedbackRequest with accepted status
        
    Returns:
        dict: Confirmation message with current statistics
        
    Raises:
        HTTPException: If recording feedback fails
    """
    try:
        logger.info(f"Recording pitch feedback: {'accepted' if request.accepted else 'rejected'}")
        
        # Get the assessment tracker
        tracker = get_assessment_tracker()
        
        # Record the feedback
        tracker.record_feedback(request.accepted)
        
        # Get updated statistics
        stats = tracker.get_statistics()
        
        return {
            "success": True,
            "message": f"Pitch feedback recorded: {'accepted' if request.accepted else 'rejected'}",
            "statistics": stats
        }
        
    except Exception as e:
        logger.error(f"Error recording pitch feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record feedback: {str(e)}")


@router.get("/pitch-assessment", response_model=PitchAssessmentResponse)
async def get_pitch_assessment() -> PitchAssessmentResponse:
    """Get pitch assessment statistics.
    
    Returns:
        PitchAssessmentResponse: Statistics on pitch acceptance and rejection
        
    Raises:
        HTTPException: If retrieving statistics fails
    """
    try:
        logger.info("Retrieving pitch assessment statistics")
        
        # Get the assessment tracker
        tracker = get_assessment_tracker()
        
        # Get statistics
        stats = tracker.get_statistics()
        
        return PitchAssessmentResponse(
            success=True,
            total_pitches=stats["total_pitches"],
            accepted=stats["accepted"],
            rejected=stats["rejected"],
            acceptance_rate=stats["acceptance_rate"],
            message="Assessment retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error retrieving pitch assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve assessment: {str(e)}")


# Include router
app.include_router(router)


# ============================================================================
# HEALTH & INFO ENDPOINTS
# ============================================================================

@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": Config.APP_NAME,
        "version": Config.APP_VERSION
    }


@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information."""
    return {
        "app": Config.APP_NAME,
        "version": Config.APP_VERSION,
        "description": "AI-powered sales pitch generator and Q&A assistant",
        "endpoints": {
            "pitch": "POST /api/v1/generate-pitch",
            "chat": "POST /api/v1/chat",
            "health": "GET /health",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=Config.DEBUG
    )
