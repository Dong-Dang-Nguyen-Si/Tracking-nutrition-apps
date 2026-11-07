import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSpatialTelemetry,
  interpolateBBox,
  filterDecodedIngredients,
  getSmartScenarioById,
} from './yoloTelemetry';

test('computeSpatialTelemetry calculates valid 3D coordinates and center for a centered can', () => {
  const res = computeSpatialTelemetry({ x1: 0.35, y1: 0.14, x2: 0.65, y2: 0.86 });
  assert.equal(res.centerX, 0.5);
  assert.equal(res.centerY, 0.5);
  assert.equal(res.xMeters, 0);
  assert.equal(res.yMeters, 0);
  assert.ok(res.zMeters >= 0.18 && res.zMeters <= 2.2);
});

test('computeSpatialTelemetry increases depth Z when bounding box is smaller', () => {
  const nearCan = computeSpatialTelemetry({ x1: 0.3, y1: 0.1, x2: 0.6, y2: 0.9 });
  const farCan = computeSpatialTelemetry({ x1: 0.42, y1: 0.35, x2: 0.58, y2: 0.65 });
  assert.ok(farCan.zMeters > nearCan.zMeters);
});

test('interpolateBBox moves smoothly toward target bbox', () => {
  const start = { x1: 0.2, y1: 0.2, x2: 0.4, y2: 0.8 };
  const target = { x1: 0.4, y1: 0.2, x2: 0.6, y2: 0.8 };
  const step = interpolateBBox(start, target, 0.5);
  assert.equal(step.x1, 0.3);
  assert.equal(step.x2, 0.5);
});

test('filterDecodedIngredients filters by category and search query', () => {
  const cautionOnly = filterDecodedIngredients('caution');
  assert.equal(cautionOnly.length, 3);
  assert.ok(cautionOnly.every((i) => i.category === 'caution'));

  const taurineSearch = filterDecodedIngredients('all', 'taurine');
  assert.equal(taurineSearch.length, 1);
  assert.equal(taurineSearch[0].id, 'taurine_1094');
});

test('getSmartScenarioById returns matching scenario or defaults to workout', () => {
  const night = getSmartScenarioById('night');
  assert.equal(night.id, 'night');
  assert.equal(night.status, 'Avoid');

  const fallback = getSmartScenarioById('unknown');
  assert.equal(fallback.id, 'workout');
});
