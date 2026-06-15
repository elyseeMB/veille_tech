from dotenv import load_dotenv

load_dotenv()

import json
from app import handler

with open("events/audio_test.json") as f:
    event = json.load(f)

result = handler(event, None)
print("RESULT:", result)
