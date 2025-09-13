from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import random

# --- Setup for serving files ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = FastAPI(title="Word Garden API")

# --- Game Data & State ---
class Plant(BaseModel):
    id: int
    growth_stage: int = 0  # 0: seed, 1: sprout, 2: flower, 3: rich flower
    position: int # Grid position 0-8

class GameState(BaseModel):
    questions: list[dict]
    current_question_index: int = 0
    streak: int = 0
    garden: dict[int, Plant] = {} # Keyed by position

# Simple dictionary to hold game sessions
game_sessions = {}

QUESTION_BANK = [
    {"q": "What is the synonym for 'ephemeral'?", "o": ["Lasting", "Brief", "Strong", "Visible"], "a": 1},
    {"q": "The term 'ubiquitous' means...", "o": ["Rare", "Hidden", "Everywhere", "Complex"], "a": 2},
    {"q": "To 'mitigate' something is to...", "o": ["Worsen it", "Lessen its severity", "Ignore it", "Analyze it"], "a": 1},
    {"q": "An 'enigma' is something that is...", "o": ["Easy to understand", "Loud and clear", "Mysterious", "A type of machine"], "a": 2},
    {"q": "What does 'precocious' mean?", "o": ["Advanced for one's age", "Slow and careful", "Dangerous", "Valuable"], "a": 0},
    {"q": "To be 'eloquent' means to be...", "o": ["Wealthy", "Fluent and persuasive", "Quiet and shy", "Physically strong"], "a": 1},
    {"q": "'Mellifluous' describes a sound that is...", "o": ["Harsh and grating", "Loud and abrupt", "Pleasingly smooth", "Silent"], "a": 2},
    {"q": "What is a 'panacea'?", "o": ["A type of illness", "A specific detail", "A difficult problem", "A universal cure"], "a": 3},
    {"q": "To 'corroborate' a story is to...", "o": ["Deny it", "Confirm or support it", "Forget it", "Invent it"], "a": 1},
    {"q": "A 'superfluous' comment is one that is...", "o": ["Essential", "Unnecessary", "Brilliant", "Humorous"], "a": 1},
]

class AnswerSubmission(BaseModel):
    session_id: str
    answer_index: int

# --- API Endpoints ---
@app.post("/api/start-game/{session_id}")
async def start_game(session_id: str):
    """Initializes a new game session."""
    shuffled_questions = random.sample(QUESTION_BANK, len(QUESTION_BANK))
    game_sessions[session_id] = GameState(questions=shuffled_questions)
    return {"question": shuffled_questions[0]}

@app.post("/api/submit-answer")
async def submit_answer(submission: AnswerSubmission):
    session_id = submission.session_id
    if session_id not in game_sessions:
        return {"error": "Session not found."}
    
    session = game_sessions[session_id]
    question_index = session.current_question_index
    question = session.questions[question_index]
    
    is_correct = (submission.answer_index == question["a"])
    
    last_plant = None
    if session.garden:
        last_plant_pos = max(session.garden.keys())
        last_plant = session.garden.get(last_plant_pos)

    if is_correct:
        session.streak += 1
        if session.streak == 1:
            # Plant a new seed
            new_pos = len(session.garden)
            if new_pos < 9: # Max 9 plots
                session.garden[new_pos] = Plant(id=new_pos, position=new_pos, growth_stage=0)
        elif last_plant and last_plant.growth_stage < 3:
            # Grow the most recent plant
            last_plant.growth_stage += 1
    else:
        session.streak = 0
    
    # Move to the next question
    session.current_question_index += 1
    game_over = session.current_question_index >= len(session.questions)
    next_question = None if game_over else session.questions[session.current_question_index]

    return {
        "correct": is_correct,
        "correct_answer": question["o"][question["a"]],
        "garden_state": {pos: plant.dict() for pos, plant in session.garden.items()},
        "next_question": next_question,
        "game_over": game_over
    }

# --- Static File Serving ---
# Create the static directory if it doesn't exist
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "index.html not found"}