import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeEyeTrace, exampleEyeTrace, parseEyeTrace, TRACE_HEADER, TraceInputError, traceSegments, traceChartDomain } from '../src/features/analysis/eyeTrace.js';
import { traceErrorMessage, traceEventReason, traceMetricRows, traceMethodDescription, traceNumber } from '../src/features/analysis/analysisPresentation.js';
import { buildTraceReport } from '../src/features/analysis/traceReport.js';
import { setLanguage } from '../src/features/language/language.js';

function edit(csv, transform) {
  return csv.split('\n').map((line, i) => i ? transform(line.split(','), i).join(',') : line).join('\n');
}
function near(actual, expected, tolerance = 1e-8) { assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`); }

test('pursuit gain recovers a known scale for both directions and a static offset does not change velocity gain', () => {
  const csv = exampleEyeTrace('pursuit');
  const result = analyzeEyeTrace(csv, 'pursuit');
  near(result.pursuitGain, 0.8);
  near(result.gainDurationMs, 4000);
  assert.equal(result.quality.sampleCount, 401);
  assert.equal(result.quality.sampleHz, 100);
  assert.equal(result.quality.ready, true);
  const offset = analyzeEyeTrace(edit(csv, (cells) => [cells[0], Number(cells[1]) + 3, cells[2], cells[3]]), 'pursuit');
  near(offset.pursuitGain, 0.8);
  assert.ok(offset.rmseDeg > result.rmseDeg);
});

test('independent constant ramp has analytical velocity gain and RMS position error', () => {
  const rows = [TRACE_HEADER];
  for (let ms = 0; ms <= 2000; ms += 20) rows.push(`${ms},${ms / 200},${ms / 100},1`);
  const result = analyzeEyeTrace(rows.join('\n'), 'pursuit');
  near(result.pursuitGain, 0.5);
  near(result.rmseDeg, Math.sqrt(Array.from({ length: 101 }, (_, i) => (i / 10) ** 2).reduce((a, b) => a + b) / 101));
});

test('saccades detect both directions with latency, finite-difference peak speed and signed displacement gain', () => {
  const result = analyzeEyeTrace(exampleEyeTrace('saccades'), 'saccades');
  assert.equal(result.events.length, 2);
  assert.equal(result.acceptedCount, 2);
  near(result.latencyMs, 200);
  near(result.peakVelocity, 187.5);
  near(result.displacementGain, 1);
  assert.deepEqual(result.events.map((event) => event.peakVelocity), [125, 250]);
  const shifted = analyzeEyeTrace(edit(exampleEyeTrace('saccades'), (cells) => [Number(cells[0]) + 5000, ...cells.slice(1)]), 'saccades');
  assert.deepEqual(shifted.events, result.events);
});

test('CSV rejects duplicate/decreasing timestamps, nonnumeric columns, missing valid angles and impossible units', () => {
  const csv = exampleEyeTrace('pursuit');
  for (const [code, data] of [
    ['header', csv.replace('eye_deg', 'eye_px')],
    ['time', edit(csv, (c, i) => i === 3 ? ['0', ...c.slice(1)] : c)],
    ['row', edit(csv, (c, i) => i === 3 ? [c[0], 'NaN', ...c.slice(2)] : c)],
    ['row', edit(csv, (c, i) => i === 3 ? [c[0], '', c[2], '1'] : c)],
    ['row', edit(csv, (c, i) => i === 3 ? [c[0], '181', ...c.slice(2)] : c)],
    ['row', edit(csv, (c, i) => i === 3 ? [c[0], '0x10', ...c.slice(2)] : c)],
    ['row', csv.replace('\n20,', '\n20,extra,')],
    ['count', `${TRACE_HEADER}\n0,0,0,1`],
    ['size', 'x'.repeat(240001)],
  ]) assert.throws(() => parseEyeTrace(data), (error) => error instanceof TraceInputError && error.code === code, code);
  assert.throws(() => analyzeEyeTrace(csv, 'other'), /mode/);
  assert.throws(() => parseEyeTrace(edit(csv, (c) => [Number(c[0]) / 1000, ...c.slice(1)])), /duration/);
  assert.throws(() => parseEyeTrace(edit(csv, (c) => [Number(c[0]) * 100, ...c.slice(1)])), /duration/);
  assert.deepEqual(parseEyeTrace(`\uFEFF${csv.replaceAll('\n', '\r\n')}`), parseEyeTrace(csv));
});

test('missing samples remain null and neither chart nor derivatives bridge them', () => {
  const csv = edit(exampleEyeTrace('pursuit'), (c, i) => i >= 81 && i <= 85 ? [c[0], '', c[2], '0'] : c);
  const samples = parseEyeTrace(csv);
  assert.equal(samples[80].eye, null);
  const segments = traceSegments(samples, 'eye');
  assert.equal(segments.length, 2);
  assert.equal(segments[0].at(-1).time, 790);
  assert.equal(segments[1][0].time, 850);
  const result = analyzeEyeTrace(csv, 'pursuit');
  assert.equal(result.quality.ready, true);
  near(result.pursuitGain, 0.8);
  near(result.gainDurationMs, 3940);
});

test('poor coverage, long gap, slow sampling and all-missing traces do not produce numerical metrics', () => {
  const csv = exampleEyeTrace('pursuit');
  const inputs = [
    edit(csv, (c, i) => i % 2 ? [c[0], '', c[2], '0'] : c),
    edit(csv, (c, i) => i >= 100 && i <= 130 ? [c[0], '', c[2], '0'] : c),
    edit(csv, (c) => [c[0], '', c[2], '0']),
    csv.split('\n').filter((_, i) => i === 0 || i % 10 === 1).join('\n'),
  ];
  for (const data of inputs) {
    const result = analyzeEyeTrace(data, 'pursuit');
    assert.equal(result.quality.ready, false);
    assert.equal(result.pursuitGain, null);
    assert.equal(result.rmseDeg, null);
  }
});

test('stationary targets have no denominator and no invented gain or saccade responses', () => {
  const csv = edit(exampleEyeTrace('pursuit'), (c) => [c[0], '0', '0', '1']);
  assert.equal(analyzeEyeTrace(csv, 'pursuit').pursuitGain, null);
  const saccades = analyzeEyeTrace(csv, 'saccades');
  assert.equal(saccades.latencyMs, null);
  assert.equal(saccades.peakVelocity, null);
  assert.equal(saccades.acceptedCount, 0);
});

test('rapid eye artifacts and neighboring intervals are excluded from velocity gain', () => {
  const csv = edit(exampleEyeTrace('pursuit'), (c, i) => i === 150 ? [c[0], '100', c[2], c[3]] : c);
  const result = analyzeEyeTrace(csv, 'pursuit');
  near(result.pursuitGain, 0.8);
  assert.ok(result.gainDurationMs < 4000);
});

test('saccade event with a short blink is excluded even when global coverage passes', () => {
  const csv = edit(exampleEyeTrace('saccades'), (c) => c[0] === '1100' ? [c[0], '', c[2], '0'] : c);
  const result = analyzeEyeTrace(csv, 'saccades');
  assert.equal(result.quality.ready, true);
  assert.equal(result.events[0].reason, 'missing');
  assert.equal(result.acceptedCount, 1);
  near(result.peakVelocity, 250);
});

test('anticipation, reverse response and incomplete movements cannot become accepted positive-latency events', () => {
  const csv = exampleEyeTrace('saccades');
  const anticipated = edit(csv, (c) => Number(c[0]) >= 950 && Number(c[0]) <= 1000 ? [c[0], (Number(c[0]) - 950) / 10, c[2], '1'] : c);
  assert.equal(analyzeEyeTrace(anticipated, 'saccades').events[0].reason, 'baseline');
  const wrong = edit(csv, (c) => [c[0], -Number(c[1]), c[2], c[3]]);
  assert.equal(analyzeEyeTrace(wrong, 'saccades').acceptedCount, 0);
  assert.equal(analyzeEyeTrace(wrong, 'saccades').events[0].reason, 'direction');
  const incomplete = edit(csv, (c) => Number(c[0]) >= 1200 && Number(c[0]) < 2000 ? [c[0], (Number(c[0]) - 1200) / 20, c[2], '1'] : c);
  assert.equal(analyzeEyeTrace(incomplete, 'saccades').events[0].reason, 'incomplete');
});

test('ramp targets are not treated as discrete saccade trials and nonuniform sampling uses real time deltas', () => {
  assert.equal(analyzeEyeTrace(exampleEyeTrace('pursuit'), 'saccades').acceptedCount, 0);
  const csv = exampleEyeTrace('pursuit').split('\n').filter((_, i) => i === 0 || i % 4 !== 0).join('\n');
  near(analyzeEyeTrace(csv, 'pursuit').pursuitGain, 0.8);
});

test('chart domains cover signed angles, retain peaks and never connect across a timestamp gap', () => {
  const samples = parseEyeTrace(exampleEyeTrace('saccades'));
  const domain = traceChartDomain(samples);
  assert.ok(domain.min < -10 && domain.max > 10);
  const peaks = traceSegments(samples, 'eye', 30).flat();
  assert.ok(peaks.some((point) => point.value === 10));
  assert.ok(peaks.some((point) => point.value === -10));
  const gap = samples.filter((p) => p.time < 1500 || p.time > 1900);
  assert.equal(traceSegments(gap, 'eye').length, 2);
});

test('reports identify synthetic/imported provenance, escape HTML, include real chart and hide unavailable metrics', () => {
  const result = analyzeEyeTrace(exampleEyeTrace('saccades'), 'saccades');
  try {
    setLanguage('en');
    const report = buildTraceReport({ analysis: result, sample: true, generatedAt: new Date('2026-11-22T10:00:00Z'), language: 'en', metrics: traceMetricRows(result), method: '<script>unsafe</script>' });
    assert.match(report, /<html lang="en">/);
    assert.match(report, /SIMULATED DATA|DEMO/);
    assert.match(report, /<polyline/);
    assert.match(report, /200/);
    assert.match(report, /187.5/);
    assert.doesNotMatch(report, /<script>/);
    assert.match(report, /&lt;script&gt;/);
    const imported = buildTraceReport({ analysis: result, sample: false, generatedAt: new Date(), language: 'en', metrics: [], method: traceMethodDescription() });
    assert.match(imported, /IMPORTED DATA/);
    assert.match(imported, /MEASUREMENT SOURCE NOT VERIFIED/);
    assert.equal(traceNumber(null), '—');
    assert.equal(traceNumber(NaN), '—');
    assert.doesNotMatch(traceErrorMessage(new TraceInputError('time', 42)), /[À-ỹ]/);
    assert.match(traceErrorMessage(new TraceInputError('time', 42)), /42/);
    assert.doesNotMatch(traceEventReason('missing'), /[À-ỹ]/);
  } finally { setLanguage('vi'); }
});
