# backend/test_db.py
from app.utils.db_handler import DBHandler

db = DBHandler()
print("✓ DB Handler imported successfully!")

# Test getting videos (will return empty list if no videos)
videos = db.get_videos_by_user('test-user')
print(f"Found {len(videos)} videos")