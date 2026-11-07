from ultralytics import YOLO

# Load a pre-trained YOLOv8 Nano model
model = YOLO('yolov8n.pt')

# Fine-tune the model on your custom dataset
# Note: 3 images is a very small dataset, so we use a high number of epochs 
# to ensure it learns the features of this specific can.
results = model.train(
    data = r'D:\Code_github\Un hackathon Lassonde\dataset\data.yaml', 
    epochs=100, 
    imgsz=640,
    device='cpu' # Set to 'cpu' if you do not have a dedicated GPU configured
)

