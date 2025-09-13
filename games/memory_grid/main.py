from fastapi import FastAPI, StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
import random
import time
from typing import List, Optional

app = FastAPI(title="Memory Grid - Cognitive Training Game")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve the main page
@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

# Data models
class GameSession(BaseModel):
    sequence_length: int
    correct_sequences: int
    total_attempts: int
    average_reaction_time: float
    session_duration: int

class SequenceResult(BaseModel):
    player_sequence: List[int]
    reaction_times: List[float]
    session_id: Optional[str] = None

# In-memory storage for game sessions (in production, use a database)
game_sessions = {}

@app.get("/api/sequence/{length}")
async def generate_sequence(length: int):
    """Generate a random sequence of the specified length"""
    if length < 1 or length > 12:  # Reasonable limits
        length = max(1, min(12, length))
    
    # Generate random sequence (grid positions 0-8 for 3x3 grid)
    sequence = [random.randint(0, 8) for _ in range(length)]
    
    # Generate unique session ID
    session_id = str(int(time.time() * 1000))
    
    return {
        "sequence": sequence,
        "session_id": session_id,
        "length": length,
        "timestamp": time.time()
    }

@app.post("/api/validate-sequence")
async def validate_sequence(result: SequenceResult):
    """Validate the player's sequence and calculate performance metrics"""
    
    # For this demo, we'll store the original sequence in a simple way
    # In production, you'd store this securely server-side
    
    # Calculate accuracy (this would compare against the stored sequence)
    # For now, we'll return basic validation
    
    performance_score = len(result.player_sequence) * 10  # Base scoring
    
    # Analyze reaction times
    avg_reaction_time = sum(result.reaction_times) / len(result.reaction_times) if result.reaction_times else 0
    
    # Bonus for fast reactions (under 1 second average)
    if avg_reaction_time < 1000:  # milliseconds
        performance_score += 20
    elif avg_reaction_time < 1500:
        performance_score += 10
    
    # Calculate cognitive metrics
    working_memory_score = min(100, len(result.player_sequence) * 8)
    focus_score = max(0, 100 - (avg_reaction_time / 50))  # Penalty for slow reactions
    
    return {
        "performance_score": performance_score,
        "working_memory_score": working_memory_score,
        "focus_score": focus_score,
        "average_reaction_time": avg_reaction_time,
        "sequence_length": len(result.player_sequence),
        "feedback": get_performance_feedback(working_memory_score, avg_reaction_time)
    }

def get_performance_feedback(memory_score: int, reaction_time: float) -> str:
    """Generate personalized feedback based on performance"""
    if memory_score >= 80 and reaction_time < 1000:
        return "Excellent! Your working memory and focus are sharp!"
    elif memory_score >= 60:
        return "Great progress! Your working memory is developing nicely."
    elif memory_score >= 40:
        return "Good effort! Keep practicing to strengthen your memory."
    else:
        return "Every attempt builds your cognitive strength. Keep going!"

@app.get("/api/difficulty-adjustment/{current_level}/{success_rate}")
async def adjust_difficulty(current_level: int, success_rate: float):
    """Adaptive difficulty adjustment based on player performance"""
    
    # Adaptive algorithm
    if success_rate >= 0.8 and current_level < 12:  # 80% success rate
        new_level = min(12, current_level + 1)
        message = "Level up! Increasing sequence length."
    elif success_rate <= 0.4 and current_level > 2:  # 40% success rate  
        new_level = max(2, current_level - 1)
        message = "Adjusting difficulty to optimize learning."
    else:
        new_level = current_level
        message = "Maintaining current difficulty level."
    
    return {
        "new_level": new_level,
        "message": message,
        "recommended_break": success_rate < 0.3  # Suggest break if struggling
    }

@app.get("/api/session-stats/{session_count}")
async def get_session_stats(session_count: int):
    """Get statistics and insights for the training session"""
    
    # Generate insights based on session length
    insights = []
    
    if session_count >= 10:
        insights.append("🧠 Extended focus session! Great for neuroplasticity.")
    if session_count >= 5:
        insights.append("💪 You're building cognitive endurance.")
    
    insights.append("🎯 Working memory training reduces rumination patterns.")
    insights.append("⚡ Regular practice improves attention control.")
    
    return {
        "total_sequences": session_count,
        "insights": insights,
        "cognitive_benefits": [
            "Enhanced working memory capacity",
            "Improved attention span",
            "Reduced mind-wandering",
            "Better cognitive flexibility",
            "Decreased rumination patterns"
        ]
    }

@app.get("/api/sounds/{sound_type}")
async def get_sound_info(sound_type: str):
    """Get information about sound patterns for accessibility"""
    
    sound_patterns = {
        "ascending": {"frequencies": [261, 294, 329, 349], "pattern": "C-D-E-F"},
        "descending": {"frequencies": [392, 349, 329, 294], "pattern": "G-F-E-D"},
        "major_chord": {"frequencies": [261, 329, 392], "pattern": "C-E-G"},
        "minor_chord": {"frequencies": [261, 311, 392], "pattern": "C-Eb-G"}
    }
    
    return sound_patterns.get(sound_type, {"frequencies": [440], "pattern": "A"})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)