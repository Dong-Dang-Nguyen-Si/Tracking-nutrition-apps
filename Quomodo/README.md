# Quomodo (product truth scanner)

A phone-style web app with three tabs: **Home**, **Scan** and **News**.

- **Scan** shows a plain camera view with no boxes and no overlays. Your trained YOLOv8 model (`model/best.onnx`, exported from `src/runs/detect/train/weights/best.pt`) runs in the browser on every frame.
- When it spots a Celsius can in 4 of the last 8 frames, a card slides up with a quick summary. Tap **Show full details** to see three tabs:
  - **Claims check**: what the can claims vs what's true
  - **Lawsuits & issues**: lawsuits, ethics, recalls, shrinkflation
  - **Company tree**: Celsius Holdings, its brands, and PepsiCo's stake
- **News** has 3 links: Trends, Recipes, Recalls. After a scan they're tailored to that product.

## Run it

Browsers only allow the camera on `localhost` or HTTPS, so serve the folder:

```bash
cd scanner-app
python3 -m http.server 8000
```

Then open http://localhost:8000 in Chrome.

To use it on a phone you need HTTPS. The quickest way is `npx localtunnel --port 8000` or ngrok, then open the https link on the phone.

## Tuning

Use URL options to tune detection, e.g. `http://localhost:8000/?conf=0.3&debug`

- `conf`: minimum score per frame (default 0.30). Lower it if the can isn't detected. Raise it if other things set it off.
- `debug`: shows the live model score at the top so you can pick a good `conf`.

Your model was trained on only a few photos and scores ~0.3 to 0.5 on validation, so detection works best with the can large in frame, label facing the camera, in good light. More training photos (50+ from different angles and backgrounds) will make it much steadier.

**Demo backup:** on a laptop, pressing **D** on the Scan screen forces the pop-up, in case the lighting at the venue is bad.

## Adding products

1. Train YOLO with more classes and re-export: `yolo export model=best.pt format=onnx imgsz=640 opset=12`
2. Put the new `best.onnx` in `model/`
3. Update `classNames` in `app.js` (same order as the model's `names`)
4. Add an entry for each class name in `products.js`
