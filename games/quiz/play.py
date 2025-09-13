import os
import json
import matplotlib.pyplot as plt
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv

# --- NEW LANGCHAIN IMPORTS ---
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser

# --- Setup ---
load_dotenv()
app = FastAPI(title="AI Quiz Generator API with LangChain")

# --- Initialize the LangChain Chat Model ---
try:
    model = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)
    print("LangChain ChatOpenAI model initialized successfully.")
except Exception as e:
    print(f"Error initializing LangChain model: {e}")
    model = None

# --- Static File Serving ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# --- Pydantic Models for Input and LangChain Output Parsing ---
class QuizRequest(BaseModel):
    topic: str
    mcq_count: int = 5
    typing_count: int = 2

# Define the desired JSON output structure for LangChain
class QuizMCQ(BaseModel):
    question: str = Field(description="The multiple-choice question.")
    options: List[str] = Field(description="A list of 4 possible options.")
    answer: str = Field(description="The correct option string.")

class QuizTyping(BaseModel):
    question: str = Field(description="The question requiring a typed answer.")
    answer: str = Field(description="The correct short answer.")

class QuizData(BaseModel):
    mcq_questions: List[QuizMCQ]
    typing_questions: List[QuizTyping]
    graph_code: str = Field(description="Python code using Matplotlib to generate a graph.")

# --- LangChain Setup (Prompt, Parser, Chain) ---
parser = PydanticOutputParser(pydantic_object=QuizData)

prompt_template = ChatPromptTemplate.from_messages([
    ("system", "You are an expert quiz creator. You must respond with a JSON object that strictly follows the provided format instructions."),
    ("user", """
        Generate a quiz on the topic: {topic}.
        Create {mcq_count} multiple-choice questions and {typing_count} typing-style questions.
        
        {format_instructions}
    """)
])

# --- Build chain ---
chain = prompt_template | model | parser

# --- API Endpoint ---
@app.post("/api/generate-quiz")
async def generate_quiz(request: QuizRequest):
    if not model:
        raise HTTPException(status_code=500, detail="LangChain model is not configured.")

    try:
        print("Invoking LangChain chain...")
        quiz_data: QuizData = chain.invoke({
            "topic": request.topic,
            "mcq_count": request.mcq_count,
            "typing_count": request.typing_count,
            "format_instructions": parser.get_format_instructions()
        })

        graph_url = None
        if quiz_data.graph_code:
            print("Executing graph code...")
            try:
                exec(quiz_data.graph_code)
                graph_url = "/static/graph.png"
                print("Graph generated successfully.")
            except Exception as e:
                print(f"Error executing graph code: {e}")

        return {"quiz": quiz_data.model_dump(), "graph_url": graph_url}

    except Exception as e:
        print(f"An error occurred in the LangChain chain: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz. Error: {str(e)}")


@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
