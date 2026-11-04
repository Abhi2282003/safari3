/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectiveBusLayout, canAppendBusLayout } from './busLayoutAssignment';

const assignments = [
  { id: '1', bus_id: 'main-bus', layout_id: 'main', valid_from: '2026-10-25' },
  { id: '2', bus_id: 'mixed-bus', layout_id: 'mixed', valid_from: '2026-11-04' },
  { id: '3', bus_id: 'main-bus', layout_id: 'mixed', valid_from: '2026-11-05' },
];
test('buses within one company retain individual layouts', () => {
  assert.equal(effectiveBusLayout({ id: 'main-bus' }, assignments, '2026-11-04'), 'main');
  assert.equal(effectiveBusLayout({ id: 'mixed-bus' }, assignments, '2026-11-04'), 'mixed');
});
test('dated change leaves earlier journeys on their original layout', () => {
  assert.equal(effectiveBusLayout({ id: 'main-bus' }, assignments, '2026-11-05'), 'mixed');
  assert.equal(effectiveBusLayout({ id: 'main-bus' }, assignments, '2026-11-04'), 'main');
});
test('cannot overwrite or insert before existing assignment history', () => {
  assert.equal(canAppendBusLayout('main-bus', assignments, '2026-11-05'), false);
  assert.equal(canAppendBusLayout('main-bus', assignments, '2026-11-04'), false);
  assert.equal(canAppendBusLayout('main-bus', assignments, '2026-11-06'), true);
});