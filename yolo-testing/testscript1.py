# test_image.py
from ultralytics import YOLO
import cv2

# Load pre-trained YOLOv8n model
print("Loading YOLOv8n model...")
model = YOLO('yolov8n.pt')  # Downloads automatically on first run
print("Model loaded!")

# Test on an image
print("\nRunning detection on image...")
results = model('https://ultralytics.com/images/bus.jpg')

# Display results
for r in results:
    print(f"\nDetected {len(r.boxes)} objects:")
    for box in r.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        class_name = model.names[cls_id]
        print(f"  - {class_name}: {conf:.2%} confidence")
    
    # Save result image
    r.save('result.jpg')
    print("\nResult saved as 'result.jpg'")