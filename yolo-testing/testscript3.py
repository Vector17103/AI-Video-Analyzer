# benchmark.py
from ultralytics import YOLO
import time
import numpy as np

print("YOLOv8 CPU Benchmark")
print("=" * 50)

# Load model
model = YOLO('yolov8n.pt')

# Create dummy frames of different sizes
test_sizes = [
    (640, 480),   # SD
    (1280, 720),  # HD
    (1920, 1080), # Full HD
]

for width, height in test_sizes:
    print(f"\nTesting {width}x{height}...")
    
    # Create random frame
    dummy_frame = np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)
    
    # Warm-up
    model(dummy_frame, verbose=False)
    
    # Benchmark
    times = []
    for i in range(10):
        start = time.time()
        results = model(dummy_frame, verbose=False)
        elapsed = time.time() - start
        times.append(elapsed)
    
    avg_time = np.mean(times)
    fps = 1 / avg_time
    
    print(f"  Average time per frame: {avg_time*1000:.1f} ms")
    print(f"  FPS: {fps:.2f}")
    print(f"  Can process video in real-time: {'✓ Yes' if fps >= 30 else '✗ No'}")

print("\n" + "=" * 50)
print("Benchmark complete!")