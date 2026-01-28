from ultralytics import YOLO
import cv2
import time
import sys

# -------------------------------
# Configuration
# -------------------------------
VIDEO_PATH = "test_video.mp4"   # Input video (must exist)
OUTPUT_PATH = "output_yolo.mp4" # Output annotated video
FRAME_SKIP = 5                  # Process every Nth frame
MODEL_NAME = "yolov8n.pt"

# -------------------------------
# Load YOLO model
# -------------------------------
print("Loading YOLOv8n model...")
model = YOLO(MODEL_NAME)
print("Model loaded!")

# -------------------------------
# Open video
# -------------------------------
cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print(f"❌ Error: Could not open video file: {VIDEO_PATH}")
    sys.exit(1)

fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print("\nVideo info:")
print(f"  Resolution: {width}x{height}")
print(f"  FPS: {fps}")
print(f"  Total frames: {total_frames}")
print(f"  Duration: {total_frames / fps:.2f} seconds")

# -------------------------------
# Video writer
# -------------------------------
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out = cv2.VideoWriter(OUTPUT_PATH, fourcc, fps, (width, height))

# -------------------------------
# Process video
# -------------------------------
print("\nProcessing video...")
frame_count = 0
start_time = time.time()

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Run YOLO on every Nth frame
    if frame_count % FRAME_SKIP == 0:
        results = model(frame, verbose=False)
        annotated_frame = results[0].plot()

        num_objects = len(results[0].boxes)
        if num_objects > 0:
            print(f"Frame {frame_count}: {num_objects} objects detected")
    else:
        annotated_frame = frame

    out.write(annotated_frame)
    frame_count += 1

# -------------------------------
# Cleanup
# -------------------------------
cap.release()
out.release()

# -------------------------------
# Performance metrics
# -------------------------------
elapsed_time = time.time() - start_time
processed_fps = frame_count / elapsed_time
real_time_factor = processed_fps / fps

print("\n=== Performance Results ===")
print(f"Total frames processed: {frame_count}")
print(f"Time taken: {elapsed_time:.2f} seconds")
print(f"Processing FPS: {processed_fps:.2f}")
print(f"Real-time factor: {real_time_factor:.2f}x")

if processed_fps < fps:
    print("\n⚠️  Processing is slower than real-time")
    print(f"   Would need {fps / processed_fps:.2f}x speedup for real-time")
else:
    print("\n✓ Can process faster than real-time!")

print(f"\n✅ Output saved to: {OUTPUT_PATH}")
