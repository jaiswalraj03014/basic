from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import time
import math
import random
import json
import os
import logging

# --- Use absolute paths for robust file serving ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = FastAPI(title="Calm Rhythm Maze API")
logger = logging.getLogger(__name__)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Game state storage (in production, use a database)
game_sessions = {}

class TapEvent(BaseModel):
    timestamp: float
    session_id: str

class GameSession(BaseModel):
    session_id: str
    level: int = 1
    position: dict = {"x": 1, "y": 1}
    score: int = 0
    rhythm_pattern: List[float] = []
    pattern_start_time: float = 0
    last_successful_tap: float = 0
    move_count: int = 0  # <-- FIX: Added missing field

class RhythmPattern:
    @staticmethod
    def generate_pattern(level: int) -> List[float]:
        """Generate rhythm pattern based on level difficulty"""
        base_bpm = 60
        pattern_length = min(8 + level, 16)
        
        patterns = {
            1: [1, 1, 1, 1],
            2: [1, 0.5, 0.5, 1],
            3: [1, 0.75, 0.25, 1, 0.5],
            4: [1, 0.33, 0.33, 0.33, 1],
            5: [1, 0.5, 0.75, 0.25, 1, 0.5]
        }
        
        base_pattern = patterns.get(min(level, 5), patterns[1])
        
        if level > 3:
            variation = random.uniform(0.9, 1.1)
            base_pattern = [beat * variation for beat in base_pattern]
        
        beat_duration = 60000 / base_bpm
        pattern_times = []
        current_time = 0
        
        for beat in base_pattern:
            pattern_times.append(current_time)
            current_time += beat * beat_duration
            
        return pattern_times

class MazeGenerator:
    @staticmethod
    def generate_maze(width: int = 10, height: int = 10):
        """Generate a simple maze layout"""
        maze = [[1 for _ in range(width)] for _ in range(height)]
        
        for y in range(1, height - 1, 2):
            for x in range(1, width - 1, 2):
                maze[y][x] = 0
                if random.random() > 0.3:
                    if x + 1 < width - 1: maze[y][x + 1] = 0
                if random.random() > 0.3:
                    if y + 1 < height - 1: maze[y + 1][x] = 0
        
        maze[1][1] = 0
        maze[height - 2][width - 2] = 0
        return maze

@app.post("/api/start-session")
async def start_session():
    """Initialize a new game session"""
    session_id = str(int(time.time() * 1000))
    
    session = GameSession(
        session_id=session_id,
        level=1,
        position={"x": 1, "y": 1},
        score=0,
        rhythm_pattern=RhythmPattern.generate_pattern(1),
        pattern_start_time=time.time() * 1000
    )
    
    game_sessions[session_id] = session
    maze = MazeGenerator.generate_maze()
    
    return {
        "session_id": session_id, "maze": maze, "rhythm_pattern": session.rhythm_pattern,
        "pattern_start_time": session.pattern_start_time, "position": session.position,
        "level": session.level, "score": session.score
    }

@app.post("/api/tap")
async def process_tap(tap: TapEvent):
    """Process a rhythm tap and move the orb if timing is correct"""
    if tap.session_id not in game_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = game_sessions[tap.session_id]
    current_time = tap.timestamp
    
    min_difference = float('inf')
    
    # --- FIX: Correct rhythm duration calculation ---
    if len(session.rhythm_pattern) < 2:
        pattern_duration = 4000 # Default fallback
    else:
        pattern_duration = session.rhythm_pattern[-1] + session.rhythm_pattern[1]

    time_since_start = current_time - session.pattern_start_time
    num_cycles = time_since_start / pattern_duration
    
    # Find difference to beats in the current and next cycle
    for cycle_offset in [math.floor(num_cycles), math.ceil(num_cycles)]:
        cycle_start_time = session.pattern_start_time + (cycle_offset * pattern_duration)
        for beat_time in session.rhythm_pattern:
            absolute_beat_time = cycle_start_time + beat_time
            difference = abs(current_time - absolute_beat_time)
            if difference < min_difference:
                min_difference = difference

    # --- Sensitivity Adjustment ---
    # Starts at 120ms, gets harder by 20ms per level, down to a minimum of 40ms.
    tolerance = max(120 - (session.level - 1) * 20, 40)
    
    success = min_difference <= tolerance
    precision_score = max(0, 100 - (min_difference / tolerance) * 100) if success else 0
    
    response = {"success": success, "precision": precision_score, "position": session.position, "score": session.score}
    
    if success:
        move_count = session.move_count
        if move_count % 2 == 0:
            session.position["x"] = min(session.position["x"] + 1, 8)
        else:
            session.position["y"] = min(session.position["y"] + 1, 8)
        
        session.move_count += 1
        session.score += int(precision_score)
        
        if session.position["x"] >= 8 and session.position["y"] >= 8:
            session.level += 1
            session.position = {"x": 1, "y": 1}
            session.rhythm_pattern = RhythmPattern.generate_pattern(session.level)
            session.pattern_start_time = current_time
            response.update({"level_complete": True, "new_level": session.level, "new_pattern": session.rhythm_pattern})
        
        response.update({"position": session.position, "score": session.score})
    
    return response

# Serve static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def serve_index():
    """Serve the main game page"""
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse(status_code=404, content={"detail": "index.html not found"})