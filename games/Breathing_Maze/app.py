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
    position: dict = {"x": 0, "y": 0}
    score: int = 0
    rhythm_pattern: List[float] = []
    pattern_start_time: float = 0
    last_successful_tap: float = 0
    move_count: int = 0 

class RhythmPattern:
    @staticmethod
    def generate_pattern(level: int) -> List[float]:
        """Generate rhythm pattern based on level difficulty"""
        base_bpm = 60  # Start at 60 BPM
        pattern_length = min(8 + level, 16)  # Increase complexity
        
        patterns = {
            1: [1, 1, 1, 1],  # Simple 4/4
            2: [1, 0.5, 0.5, 1],  # Mixed rhythms
            3: [1, 0.75, 0.25, 1, 0.5],  # Syncopated
            4: [1, 0.33, 0.33, 0.33, 1],  # Triplets
            5: [1, 0.5, 0.75, 0.25, 1, 0.5]  # Complex
        }
        
        base_pattern = patterns.get(min(level, 5), patterns[1])
        
        # Add slight variations for higher levels
        if level > 3:
            variation = random.uniform(0.9, 1.1)
            base_pattern = [beat * variation for beat in base_pattern]
        
        # Convert to milliseconds
        beat_duration = 60000 / base_bpm  # ms per beat
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
        
        # Create paths
        for y in range(1, height - 1, 2):
            for x in range(1, width - 1, 2):
                maze[y][x] = 0  # Path
                
                # Random connections
                if random.random() > 0.3:
                    if x + 1 < width - 1:
                        maze[y][x + 1] = 0
                if random.random() > 0.3:
                    if y + 1 < height - 1:
                        maze[y + 1][x] = 0
        
        # Ensure start and end are accessible
        maze[1][1] = 0  # Start
        maze[height - 2][width - 2] = 0  # End
        
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
        "session_id": session_id,
        "maze": maze,
        "rhythm_pattern": session.rhythm_pattern,
        "pattern_start_time": session.pattern_start_time,
        "position": session.position,
        "level": session.level,
        "score": session.score
    }

@app.post("/api/tap")
async def process_tap(tap: TapEvent):
    """Process a rhythm tap and move the orb if timing is correct"""
    if tap.session_id not in game_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = game_sessions[tap.session_id]
    current_time = tap.timestamp
    
    # Calculate expected tap time
    pattern_progress = (current_time - session.pattern_start_time) % sum(session.rhythm_pattern)
    
    # Find closest expected beat
    closest_beat_time = None
    min_difference = float('inf')
    
    for beat_time in session.rhythm_pattern:
        # Account for pattern repetition
        beat_times_in_cycle = []
        pattern_duration = sum(session.rhythm_pattern)
        cycle_start = session.pattern_start_time
        
        while cycle_start < current_time + 1000:  # Look ahead 1 second
            beat_times_in_cycle.append(cycle_start + beat_time)
            cycle_start += pattern_duration
        
        for beat_time_abs in beat_times_in_cycle:
            difference = abs(current_time - beat_time_abs)
            if difference < min_difference:
                min_difference = difference
                closest_beat_time = beat_time_abs
    
    # Tolerance decreases with level (starts at 200ms, decreases to 50ms)
    tolerance = max(200 - (session.level - 1) * 30, 50)
    
    success = min_difference <= tolerance
    precision_score = max(0, 100 - (min_difference / tolerance) * 100) if success else 0
    
    response = {
        "success": success,
        "precision": precision_score,
        "timing_difference": min_difference,
        "tolerance": tolerance,
        "position": session.position,
        "score": session.score
    }
    
    if success:
        # Move orb forward
        # Simple movement: alternate between x and y movement
        move_count = getattr(session, 'move_count', 0)
        if move_count % 2 == 0:
            session.position["x"] = min(session.position["x"] + 1, 8)
        else:
            session.position["y"] = min(session.position["y"] + 1, 8)
        
        session.move_count = move_count + 1
        session.score += int(precision_score)
        session.last_successful_tap = current_time
        
        # Check if level complete (reached end)
        if session.position["x"] >= 8 and session.position["y"] >= 8:
            session.level += 1
            session.position = {"x": 1, "y": 1}
            session.rhythm_pattern = RhythmPattern.generate_pattern(session.level)
            session.pattern_start_time = current_time
            
            response.update({
                "level_complete": True,
                "new_level": session.level,
                "new_pattern": session.rhythm_pattern,
                "pattern_start_time": session.pattern_start_time
            })
        
        response.update({
            "position": session.position,
            "score": session.score
        })
    
    return response

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Get current session state"""
    if session_id not in game_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = game_sessions[session_id]
    return {
        "session_id": session_id,
        "position": session.position,
        "level": session.level,
        "score": session.score,
        "rhythm_pattern": session.rhythm_pattern,
        "pattern_start_time": session.pattern_start_time
    }

@app.get("/api/leaderboard")
async def get_leaderboard():
    """Get top scores"""
    # Sort sessions by score
    sorted_sessions = sorted(
        game_sessions.values(),
        key=lambda x: x.score,
        reverse=True
    )
    
    return [
        {
            "score": session.score,
            "level": session.level,
            "session_id": session.session_id[:8]  # Shortened for privacy
        }
        for session in sorted_sessions[:10]
    ]

# Create static directory if it doesn't exist
static_dir = "static"
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
    logger.info(f"Created {static_dir} directory")

# Serve static files
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
    logger.info("Mounted static files")
except Exception as e:
    logger.warning(f"Could not mount static files: {e}")

@app.get("/")
async def serve_index():
    """Serve the main game page"""
    try:
        if os.path.exists("static/index.html"):
            return FileResponse("static/index.html")
        else:
            return JSONResponse(
                status_code=404,
                content={"detail": "Frontend not found. Please ensure index.html is in the static/ directory."}
            )
    except Exception as e:
        logger.error(f"Error serving index: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Could not serve index: {str(e)}"}
        )

def main():
    """Main function to run the server"""
    import uvicorn
    
    print("=" * 60)
    print("🎵 Starting Calm Rhythm Maze Server 🎵")
    print("=" * 60)
    print(f"Server will be available at: http://localhost:8000")
    print(f"API docs at: http://localhost:8000/docs")
    print(f"Health check at: http://localhost:8000/health")
    print("=" * 60)
    
    # Check if static directory exists
    if not os.path.exists("static/index.html"):
        print("⚠️  WARNING: static/index.html not found!")
        print("Please ensure the frontend HTML file is saved as 'static/index.html'")
        print("=" * 60)
    
    try:
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000,
            log_level="info",
            access_log=True
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        print("Make sure port 8000 is not already in use")

if __name__ == "__main__":
    main()