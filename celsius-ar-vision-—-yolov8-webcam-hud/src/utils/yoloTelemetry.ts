import { INGREDIENTS_DATA, IngredientItem, SMART_SCENARIOS, SmartScenario } from '../data/celsiusData';

export interface NormalizedBBox {
  x1: number; // 0..1
  y1: number; // 0..1
  x2: number; // 0..1
  y2: number; // 0..1
}

export interface SpatialTelemetry {
  xMeters: number;
  yMeters: number;
  zMeters: number;
  widthRatio: number;
  heightRatio: number;
  centerX: number;
  centerY: number;
}

const REAL_CELSIUS_CAN_HEIGHT_M = 0.156; // 355mL sleek can = 15.6 cm
const NORMALIZED_FOCAL_FACTOR = 0.34;

/**
 * Computes 3D camera-relative coordinates (X, Y, Z in meters) and normalized center
 * from a normalized YOLOv8 bounding box [x1, y1, x2, y2].
 */
export function computeSpatialTelemetry(bbox: NormalizedBBox): SpatialTelemetry {
  const clampedX1 = Math.max(0, Math.min(1, bbox.x1));
  const clampedY1 = Math.max(0, Math.min(1, bbox.y1));
  const clampedX2 = Math.max(clampedX1 + 0.02, Math.min(1, bbox.x2));
  const clampedY2 = Math.max(clampedY1 + 0.05, Math.min(1, bbox.y2));

  const widthRatio = +(clampedX2 - clampedX1).toFixed(4);
  const heightRatio = +(clampedY2 - clampedY1).toFixed(4);
  const centerX = +((clampedX1 + clampedX2) / 2).toFixed(4);
  const centerY = +((clampedY1 + clampedY2) / 2).toFixed(4);

  // Estimate depth Z (meters) inversely proportional to apparent bounding box height
  const rawZ = (REAL_CELSIUS_CAN_HEIGHT_M * (NORMALIZED_FOCAL_FACTOR / 0.156)) / Math.max(heightRatio, 0.12);
  const zMeters = +Math.max(0.18, Math.min(2.2, rawZ)).toFixed(2);
  const xMeters = +((centerX - 0.5) * zMeters * 1.25).toFixed(2);
  const yMeters = +((0.5 - centerY) * zMeters * 0.85).toFixed(2);

  return {
    xMeters,
    yMeters,
    zMeters,
    widthRatio,
    heightRatio,
    centerX,
    centerY,
  };
}

/**
 * Smoothly interpolates between previous bounding box and target bounding box
 * so AR HUD callouts and overlays glide without jitter.
 */
export function interpolateBBox(
  current: NormalizedBBox,
  target: NormalizedBBox,
  alpha: number = 0.25
): NormalizedBBox {
  const t = Math.max(0, Math.min(1, alpha));
  return {
    x1: +(current.x1 + (target.x1 - current.x1) * t).toFixed(4),
    y1: +(current.y1 + (target.y1 - current.y1) * t).toFixed(4),
    x2: +(current.x2 + (target.x2 - current.x2) * t).toFixed(4),
    y2: +(current.y2 + (target.y2 - current.y2) * t).toFixed(4),
  };
}

/**
 * Filters ingredients by category and optional search query.
 */
export function filterDecodedIngredients(
  category: 'all' | 'caution' | 'mystery' | 'good',
  searchQuery: string = '',
  items: IngredientItem[] = INGREDIENTS_DATA
): IngredientItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    const matchesCat = category === 'all' || item.category === category;
    if (!matchesCat) return false;
    if (!normalizedQuery) return true;
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.labelOnCan.toLowerCase().includes(normalizedQuery) ||
      item.truth.toLowerCase().includes(normalizedQuery) ||
      item.impact.toLowerCase().includes(normalizedQuery)
    );
  });
}

/**
 * Retrieves a SmartScenario by ID, defaulting to 'workout'.
 */
export function getSmartScenarioById(
  id: string,
  scenarios: SmartScenario[] = SMART_SCENARIOS
): SmartScenario {
  return scenarios.find((s) => s.id === id) || scenarios[0];
}
