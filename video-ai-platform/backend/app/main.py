from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload
from app.routes import detections  # Make sure this is imported

app = FastAPI(
    title="Video AI Detection API",
    description="Backend API for video object detection",
    version="1.0.0"
)

# Configure CORS - Allow both localhost AND your network IP
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.111.1.95:3000",  # Your network IP
        "http://10.111.4.149:3000",  # Alternative network IP (from your earlier screenshots)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api")
app.include_router(detections.router, prefix="/api")  # Add this line

@app.get("/")
async def root():
    return {"message": "Video AI Detection API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}