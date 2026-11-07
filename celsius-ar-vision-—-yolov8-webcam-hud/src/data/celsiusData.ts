export interface IngredientItem {
  id: string;
  name: string;
  labelOnCan: string;
  category: 'caution' | 'mystery' | 'good';
  categoryLabel: string;
  riskScore: number;
  riskLabel: string;
  truth: string;
  impact: string;
  canRegion: {
    rx: number;
    ry: number;
    rw: number;
    rh: number;
    ocrTag: string;
  };
}

export interface DramaItem {
  id: string;
  year: string;
  category: string;
  severity: 'High' | 'Moderate';
  title: string;
  summary: string;
  verdict: string;
}

export interface SmartScenario {
  id: 'workout' | 'study' | 'empty' | 'night';
  title: string;
  subtitle: string;
  rating: string;
  status: 'Optimal' | 'Caution' | 'Avoid';
  headline: string;
  description: string;
  smartDeviceMetrics: {
    heartRateDelta: string;
    sleepImpact: string;
    hydrationNeed: string;
    metabolicWindow: string;
  };
}

export const INGREDIENTS_DATA: IngredientItem[] = [
  {
    id: 'citric_malic',
    name: 'Citric Acid & Malic Acid',
    labelOnCan: 'Citric acid, Malic acid (2nd & 4th ingredients)',
    category: 'caution',
    categoryLabel: 'Acidity & Preservative Claim',
    riskScore: 3.5,
    riskLabel: '3.5 / 5.0 · Enamel & Gastric Risk',
    truth:
      'Added for tart flavor and microbial stability—allowing Celsius to market "No Preservatives" while still chemically preventing spoilage (which triggered an $8.2M class-action settlement).',
    impact:
      'Drops beverage pH to ~3.1 (approaching vinegar). Softens tooth enamel and can trigger acid reflux or stomach irritation when consumed on an empty stomach.',
    canRegion: {
      rx: 0.52,
      ry: 0.14,
      rw: 0.42,
      rh: 0.1,
      ocrTag: 'ACID_CITRIC_MALIC 0.93',
    },
  },
  {
    id: 'taurine_1094',
    name: 'Taurine (1,094 mg — Over 1 Gram)',
    labelOnCan: 'Taurine: 1094 mg (3rd ingredient, 7.8x more than Caffeine)',
    category: 'mystery',
    categoryLabel: 'Scary Name · Actually Beneficial',
    riskScore: 1.0,
    riskLabel: '1.0 / 5.0 · Safe & Cardioprotective',
    truth:
      'Despite urban myths, Taurine is not a stimulant. It is a naturally occurring amino sulfonic acid abundant in human heart, brain, and skeletal muscle tissue (safe up to 3,000 mg/day per EFSA).',
    impact:
      'Modulates intracellular calcium to stabilize heart rhythm, reduces muscular oxidative stress during workouts, and smooths out jitteriness from 140 mg caffeine.',
    canRegion: {
      rx: 0.08,
      ry: 0.48,
      rw: 0.44,
      rh: 0.09,
      ocrTag: 'TAURINE_1094MG 0.96',
    },
  },
  {
    id: 'caffeine_140',
    name: 'Caffeine (140 mg) + Green Tea Extract',
    labelOnCan: 'Caffeine: 140 mg, Instant green tea (EGCG catechins)',
    category: 'caution',
    categoryLabel: 'High Stimulant · Health Canada Warning',
    riskScore: 3.5,
    riskLabel: '3.5 / 5.0 · Max 1 Can / Day',
    truth:
      'Equals ~1.5 espresso shots. Combines anhydrous caffeine with green tea catechins (EGCG) to elevate sympathetic nervous activity, prompting Health Canada’s mandatory top-can warning.',
    impact:
      'Boosts endurance and thermogenesis during exercise, but sitting sedentary with 140 mg can cause resting tachycardia, anxiety, and suppressed REM/deep sleep.',
    canRegion: {
      rx: 0.08,
      ry: 0.36,
      rw: 0.44,
      rh: 0.1,
      ocrTag: 'CAFFEINE_140MG 0.97',
    },
  },
  {
    id: 'sucralose_acek',
    name: 'Sucralose & Acesulfame Potassium (Ace-K)',
    labelOnCan: 'Sucralose, Acesulfame potassium',
    category: 'caution',
    categoryLabel: 'Artificial Sweetener Duo',
    riskScore: 2.5,
    riskLabel: '2.5 / 5.0 · Microbiome & Insulin Response',
    truth:
      'Achieves "Zero Sugar / 10 Calories" using synthetic high-intensity sweeteners 200x–600x sweeter than sucrose. Ace-K is blended specifically to mask the metallic aftertaste of Sucralose.',
    impact:
      'Avoids immediate glycemic spikes, but daily high-frequency intake is linked to altered gut microbiome diversity and heightened sweet-taste habituation.',
    canRegion: {
      rx: 0.52,
      ry: 0.27,
      rw: 0.42,
      rh: 0.09,
      ocrTag: 'SUCRALOSE_ACE_K 0.92',
    },
  },
  {
    id: 'glucuronolactone',
    name: 'Glucuronolactone & Ginger Root Extract',
    labelOnCan: 'Glucuronolactone, Instant green tea, Ginger',
    category: 'mystery',
    categoryLabel: 'Complex Chemical Name · Benign',
    riskScore: 1.0,
    riskLabel: '1.0 / 5.0 · Naturally Metabolized',
    truth:
      'Sounds like an industrial solvent, but Glucuronolactone is a natural glucose metabolite synthesized in the human liver to support connective tissue and structural cartilage.',
    impact:
      'Rapidly metabolized and harmless at beverage doses; ginger root extract mildly aids gastric motility and thermogenesis.',
    canRegion: {
      rx: 0.52,
      ry: 0.41,
      rw: 0.42,
      rh: 0.08,
      ocrTag: 'GLUCURONOLACTONE 0.91',
    },
  },
  {
    id: 'vitamin_b_complex',
    name: 'High-Dose Vitamin B Complex (118%–250% DV)',
    labelOnCan: 'B12 (250%), B5 (200%), B2 (154%), B3 (125%), B6 (118%), Vit C (67%)',
    category: 'good',
    categoryLabel: 'Water-Soluble Vitamin Halo',
    riskScore: 1.0,
    riskLabel: '1.0 / 5.0 · Excess Excreted by Kidneys',
    truth:
      'Uses technical chemical vitamers on the ingredient list (Cyanocobalamin = B12, Riboflavin = B2, Pyridoxine = B6) to reinforce a functional fitness supplement image.',
    impact:
      'Supports cellular energy metabolism if you are deficient; because B-vitamins are water-soluble, excess amounts are filtered out by the kidneys within hours.',
    canRegion: {
      rx: 0.08,
      ry: 0.22,
      rw: 0.44,
      rh: 0.11,
      ocrTag: 'VITAMIN_B_MATRIX 0.95',
    },
  },
];

export const DRAMA_DATA: DramaItem[] = [
  {
    id: 'fda_vodka_recall',
    year: 'July 2024 – 2025',
    category: 'FDA Class Recall · Packaging Safety',
    severity: 'High',
    title: 'FDA Recall: Empty CELSIUS Cans Mistakenly Filled with Vodka Seltzer',
    summary:
      'A third-party packaging supplier accidentally shipped empty CELSIUS Astro Vibe cans to alcohol producer High Noon, which filled them with 4.5% ABV vodka seltzer and distributed them across multiple US states.',
    verdict:
      'Exposed supply-chain quality control vulnerabilities, creating an unintentional alcohol ingestion hazard for minors, athletes, and drivers.',
  },
  {
    id: 'preservative_lawsuit',
    year: '2022 – 2023',
    category: 'Class-Action Lawsuit · $8.2M Settlement',
    severity: 'High',
    title: '$8.2 Million Settlement Over False "No Preservatives" Label Claim',
    summary:
      'Consumers filed a class-action lawsuit (Hezi v. Celsius Holdings) challenging the "No Preservatives" claim on cans that contained Citric Acid—an FDA-recognized chemical preservative and acidulant.',
    verdict:
      'Celsius agreed to pay $8.2M to settle without admitting wrongdoing and removed the "No Preservatives" claim from North American packaging.',
  },
  {
    id: 'flo_rida_verdict',
    year: 'January 2023',
    category: 'Breach of Contract · $82.6M Jury Verdict',
    severity: 'High',
    title: '$82.6 Million Jury Verdict for Concealing Sales Milestones from Flo Rida',
    summary:
      'Early brand ambassador Flo Rida helped turn Celsius into a mainstream fitness brand (2014–2018), then sued after discovering the company used accounting definitions to deny his promised 1% equity bonus.',
    verdict:
      'A Florida jury ruled against Celsius Holdings for intentional breach of contract, awarding $82.6M in damages.',
  },
  {
    id: 'supply_chain_audit',
    year: '2024 – 2026 Audit',
    category: 'Supply Chain & Tier-3 Sourcing Opacity',
    severity: 'Moderate',
    title: 'North American Bottling Compliance vs. Overseas Ingredient Opacity',
    summary:
      'Direct canning ("Prepared in Canada for CELSIUS, Inc. Boca Raton, FL") complies with North American labor standards. However, imported botanical and synthetic inputs (green tea, ginger, synthetic Taurine, B-vitamins) lack independent Fair Trade or farm-level disclosures.',
    verdict:
      'Verified factory labor compliance in Canada/US, but limited transparency on Tier-2/3 raw chemical and agricultural suppliers.',
  },
];

export const SMART_SCENARIOS: SmartScenario[] = [
  {
    id: 'workout',
    title: 'Pre-Workout / Gym',
    subtitle: 'Active Muscular Output',
    rating: '7.8 / 10',
    status: 'Optimal',
    headline: 'Ideal Window: Active Exercise Neutralizes Jitters & Maximizes Ergogenic Output',
    description:
      '140 mg Caffeine + 1,094 mg Taurine + green tea catechins peak 30–45 minutes post-ingestion. Active skeletal muscle contraction utilizes mobilized fatty acids and prevents adrenaline buildup. Consume 20–30 minutes before training after a light snack.',
    smartDeviceMetrics: {
      heartRateDelta: '+8 to +14 BPM (Exercise Synced)',
      sleepImpact: 'Minimal if taken >7 hrs before bed',
      hydrationNeed: '+500 mL water recommended',
      metabolicWindow: 'Peak output: 30 – 120 mins',
    },
  },
  {
    id: 'study',
    title: 'Studying / Desk Work',
    subtitle: 'Sedentary Cognitive Load',
    rating: '5.0 / 10',
    status: 'Caution',
    headline: 'Sedentary Caution: 140 mg Bolus While Sitting Can Trigger Resting Tachycardia',
    description:
      'Without physical movement to clear circulating catecholamines, a rapid 140 mg caffeine spike at a desk frequently triggers smartwatch High Heart Rate alerts, fine motor tremor, and an afternoon focus crash. Sip half a can (70 mg) slowly over 90 minutes.',
    smartDeviceMetrics: {
      heartRateDelta: '+12 to +22 BPM (Sedentary Spike)',
      sleepImpact: 'Moderate HRV suppression',
      hydrationNeed: '+350 mL water + food buffer',
      metabolicWindow: 'Sip 50% can over 90 mins',
    },
  },
  {
    id: 'empty',
    title: 'Empty Stomach / Thirsty',
    subtitle: 'Fasted Gastric State',
    rating: '2.5 / 10',
    status: 'Avoid',
    headline: 'Avoid Fasted Intake: Dual Acids (pH ~3.1) + Caffeine Irritate Gastric Mucosa',
    description:
      'Citric Acid + Malic Acid combined with carbonation and 140 mg caffeine aggressively stimulate gastric acid secretion on an empty stomach, causing nausea, reflux, and rapid enamel demineralization. Never use an energy drink as primary hydration.',
    smartDeviceMetrics: {
      heartRateDelta: '+15 BPM + Vagal Stress Drop',
      sleepImpact: 'Elevated cortisol response',
      hydrationNeed: 'Drink 300 mL plain water first',
      metabolicWindow: 'Pair with complex carbs/protein',
    },
  },
  {
    id: 'night',
    title: 'After 4:00 PM / Evening',
    subtitle: 'Circadian Phase Lock',
    rating: '1.5 / 10',
    status: 'Avoid',
    headline: 'Circadian Disruption: 5.5-Hour Half-Life Blocks Deep & REM Sleep Architecture',
    description:
      'Consuming 140 mg of caffeine at 5:00 PM leaves ~70 mg actively bound to brain adenosine receptors at 10:30 PM. Wearable sleep trackers consistently record a 20%–35% reduction in deep slow-wave sleep and overnight Heart Rate Variability (HRV).',
    smartDeviceMetrics: {
      heartRateDelta: '+6 BPM Overnight Resting HR',
      sleepImpact: '-30% Deep Sleep / Lower HRV',
      hydrationNeed: 'Switch to decaf / electrolytes',
      metabolicWindow: 'Hard cutoff: 8 hrs before sleep',
    },
  },
];

export const GOLDEN_RULES = [
  {
    title: '01. Enamel Shield (pH 3.1)',
    detail:
      'Citric + Malic Acid soften tooth enamel on contact. Sip with a straw, rinse with plain water immediately after finishing, and wait 30 minutes before brushing.',
  },
  {
    title: '02. Single-Can Daily Ceiling',
    detail:
      'Health Canada mandates a strict 1-serving/day limit on the black top rim. Combining two cans pushes caffeine to 280 mg and Taurine above 2,188 mg.',
  },
  {
    title: '03. 1:2 Hydration Pairing',
    detail:
      '140 mg caffeine is mildly natriuretic and excess B-vitamins require renal clearance. Match every 355 mL Celsius can with 500 mL of plain water.',
  },
];

export const CLEANER_ALTERNATIVES = [
  {
    name: 'Cold-Brew Matcha Green Tea',
    metrics: '70 mg Caffeine · L-Theanine · pH 6.5',
    reason: 'Natural L-Theanine promotes alpha-wave focus without heart palpitations or artificial sweeteners.',
  },
  {
    name: 'Iced Americano / Cold Brew',
    metrics: '110 mg Caffeine · 0 Additives · pH 5.0',
    reason: 'Only two ingredients (coffee + water) and ~100x less acidic than pH 3.1 carbonated energy drinks.',
  },
  {
    name: 'Coconut Water + Pinch of Sea Salt',
    metrics: '0 mg Caffeine · 600 mg Potassium',
    reason: 'True cellular rehydration and electrolyte replenishment when you are thirsty rather than fatigued.',
  },
];

export const VSCODE_PYTHON_BRIDGE_CODE = `import time
import cv2
from ultralytics import YOLO
from flask import Flask, Response, jsonify
from flask_cors import CORS

# ==============================================================================
# VS CODE YOLOv8 WEBCAM BRIDGE FOR CELSIUS AR WEB HUD
# 1. Install dependencies in VS Code terminal:
#    pip install ultralytics opencv-python flask flask-cors
# 2. Run this file:
#    python trial_web.py
# 3. Open the HTML file or Web App — it connects to http://127.0.0.1:5000!
# ==============================================================================

app = Flask(__name__)
CORS(app)

# 1. Load your trained Celsius YOLOv8 weights (same path as your trial.py)
MODEL_PATH = r'runs/detect/train/weights/best.pt'
try:
    model = YOLO(MODEL_PATH)
    print(f"[OK] Loaded custom model: {MODEL_PATH}")
except Exception as e:
    print(f"[INFO] Custom weights not found at {MODEL_PATH}, falling back to yolov8n.pt: {e}")
    model = YOLO('yolov8n.pt')

# 2. Initialize Webcam (0 = default camera, 1280x720)
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

# Live detection state shared with the HTML frontend
latest_detection = {
    "detected": False,
    "label": "Celsius energy drink",
    "confidence": 0.0,
    "bbox": [0.35, 0.15, 0.65, 0.92],  # normalized [x1, y1, x2, y2]
    "fps": 60,
    "timestamp": 0.0
}

def generate_yolo_stream():
    prev_time = time.time()
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break

        h, w, _ = frame.shape
        now = time.time()
        fps = int(1.0 / max(now - prev_time, 0.001))
        prev_time = now

        # Run YOLOv8 inference just like your trial.py
        results = model.predict(source=frame, conf=0.5, verbose=False)
        found_can = False
        annotated_frame = frame

        for r in results:
            annotated_frame = r.plot()
            if len(r.boxes) > 0:
                box = r.boxes[0]
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                cls_name = model.names.get(cls_id, "Celsius energy drink")

                latest_detection.update({
                    "detected": True,
                    "label": cls_name,
                    "confidence": round(conf, 2),
                    "bbox": [
                        round(x1 / w, 4),
                        round(y1 / h, 4),
                        round(x2 / w, 4),
                        round(y2 / h, 4)
                    ],
                    "fps": min(fps, 60),
                    "timestamp": now
                })
                found_can = True
                break

        if not found_can:
            # Keep detection warm for 0.6s to prevent flicker between frames
            if now - latest_detection["timestamp"] > 0.6:
                latest_detection["detected"] = False
                latest_detection["confidence"] = 0.0
            latest_detection["fps"] = min(fps, 60)

        ret, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if not ret:
            continue
        yield (b'--frame\\r\\n'
               b'Content-Type: image/jpeg\\r\\n\\r\\n' + buffer.tobytes() + b'\\r\\n')

@app.route('/video_feed')
def video_feed():
    """Full-screen MJPEG stream with YOLOv8 bounding box drawn"""
    return Response(generate_yolo_stream(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/telemetry')
def telemetry():
    """Real-time JSON state so the HTML overlay pops up when Celsius is detected"""
    return jsonify(latest_detection)

if __name__ == '__main__':
    print("==========================================================")
    print(" Celsius Live Detector Web Server running at:")
    print(" -> Video Stream: http://127.0.0.1:5000/video_feed")
    print(" -> Telemetry:    http://127.0.0.1:5000/telemetry")
    print("==========================================================")
    app.run(host='0.0.0.0', port=5000, threaded=True)
`;
