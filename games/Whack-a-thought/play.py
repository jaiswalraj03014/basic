from fastapi import FastAPI, StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import random

app = FastAPI(title="Whack-a-Thought Game")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve the main page
@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

# Word sets for the game
NEGATIVE_WORDS = [
    "failure", "worthless", "hopeless", "stupid", "ugly", "useless", "weak",
    "pathetic", "disaster", "terrible", "awful", "horrible", "disgusting",
    "loser", "reject", "burden", "mistake", "embarrassing", "shameful", "guilty"
]

POSITIVE_WORDS = [
    "success", "valuable", "hopeful", "smart", "beautiful", "useful", "strong",
    "amazing", "wonderful", "great", "awesome", "fantastic", "lovely",
    "winner", "accepted", "helpful", "perfect", "proud", "confident", "peaceful"
]

NEUTRAL_WORDS = [
    "chair", "table", "book", "phone", "water", "tree", "car", "house",
    "computer", "music", "coffee", "paper", "window", "door", "clock",
    "shoes", "jacket", "sandwich", "keyboard", "mirror"
]

@app.get("/api/words")
async def get_words():
    """Get a random mix of words for the game"""
    # Create a balanced mix: 40% negative, 30% positive, 30% neutral
    words = []
    
    # Add negative words (these should be clicked)
    negative_sample = random.sample(NEGATIVE_WORDS, min(8, len(NEGATIVE_WORDS)))
    words.extend([{"text": word, "type": "negative"} for word in negative_sample])
    
    # Add positive words (decoys - shouldn't be clicked)
    positive_sample = random.sample(POSITIVE_WORDS, min(6, len(POSITIVE_WORDS)))
    words.extend([{"text": word, "type": "positive"} for word in positive_sample])
    
    # Add neutral words (decoys - shouldn't be clicked)
    neutral_sample = random.sample(NEUTRAL_WORDS, min(6, len(NEUTRAL_WORDS)))
    words.extend([{"text": word, "type": "neutral"} for word in neutral_sample])
    
    # Shuffle the words
    random.shuffle(words)
    
    return {"words": words}

@app.get("/api/encouragement")
async def get_encouragement():
    """Get encouraging messages for successful gameplay"""
    messages = [
        "Great job identifying negative thoughts!",
        "You're building mental resilience!",
        "Keep focusing on what matters!",
        "Excellent cognitive awareness!",
        "You're retraining your brain!",
        "Mindful thinking in action!",
        "Well done staying focused!",
        "Your mental clarity is improving!"
    ]
    return {"message": random.choice(messages)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)