import cv2
from ultralytics import YOLO

# 1. Nạp trọng số
model = YOLO(r'runs/detect/train/weights/best.pt')

# 2. Khởi tạo webcam (0 là camera mặc định của máy)
cap = cv2.VideoCapture(0)

# Thiết lập độ phân giải 1280x720 (tùy chọn)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Camera frame unavailable.")
        break

    # Chạy inference với stream=True để tối ưu luồng video
    results = model.predict(source=frame, conf=0.5, stream=True, verbose=False)

    for r in results:
        annotated_frame = r.plot()

    cv2.imshow("Celsius Live Detector (Press Q to quit)", annotated_frame)

    # Nhấn phím 'q' trên bàn phím để dừng
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()