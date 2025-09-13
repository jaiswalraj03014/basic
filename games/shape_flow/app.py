from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🎮 Define Levels
LEVELS = {
    1: {"name": "Shape Flow", "pattern": ["circle", "square", "triangle"], "active_slots": 3},
    2: {"name": "Color Sync", "pattern": ["red", "blue", "green"], "active_slots": 3},
}

# 🎮 Player Move Schema
class Move(BaseModel):
    choice: str

# 🎮 Game Session
class GameSession:
    def __init__(self, level: int):
        self.level = level
        self.pieces_in_queue = []
        self.active_slots = LEVELS[level]["active_slots"]
        self.pattern = LEVELS[level]["pattern"]
        self.score = 0
        self.lives = 3
        self.generate_pieces()

    def generate_pieces(self):
        options = self.pattern
        self.pieces_in_queue = [random.choice(options) for _ in range(5)]

    def get_next_piece(self):
        if not self.pieces_in_queue:
            self.generate_pieces()
        return self.pieces_in_queue[0]

    def play_move(self, choice: str):
        correct_piece = self.pieces_in_queue.pop(0)  # take the first
        if choice == correct_piece:
            self.score += 10
            result = "correct"
        else:
            self.lives -= 1
            result = "wrong"
        return {
            "result": result,
            "expected": correct_piece,
            "score": self.score,
            "lives": self.lives,
            "next_piece": self.get_next_piece() if self.lives > 0 else None,
            "game_over": self.lives <= 0,
        }

# Store sessions
game_sessions = {}

# 🎮 Start Game
@app.post("/api/start-game/{session_id}")
async def start_game(session_id: str, level: int = 1):
    level_data = LEVELS.get(level, LEVELS[1])
    game_sessions[session_id] = GameSession(level)
    return {
        "message": f"Level {level} started.",
        "level_name": level_data["name"],
        "pattern": level_data["pattern"],
        "next_piece": game_sessions[session_id].get_next_piece(),
        "active_slots": game_sessions[session_id].active_slots,
        "score": 0,
        "lives": 3,
    }

# 🎮 Play a Move
@app.post("/api/play/{session_id}")
async def play_move(session_id: str, move: Move):
    session = game_sessions.get(session_id)
    if not session:
        return {"error": "No active session found."}
    return session.play_move(move.choice)
