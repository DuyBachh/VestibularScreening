// Numerical research prototype. Input angles must already be calibrated externally.
// No camera tracking, normative thresholds or clinical interpretation is performed.
export const TRACE_HEADER = 'time_ms,eye_deg,target_deg,valid';
export const TRACE_MAX_LENGTH = 240000;
export const TRACE_MAX_SAMPLES = 6000;
export const TRACE_ALGORITHM = 'eye-trace-v1';

export class TraceInputError extends Error {
  /** @param {string} code @param {number} [row] */
  constructor(code, row = 0) { super(code); this.code = code; this.row = row; }
}
/** @typedef {{time: number, eye: number | null, target: number, valid: boolean}} TraceSample */
/** Strict unquoted CSV; one axis, milliseconds and degrees. Missing samples stay missing.
 * @param {string} csv @returns {TraceSample[]} */
export function parseEyeTrace(csv) {
  if (typeof csv !== 'string' || csv.length > TRACE_MAX_LENGTH) throw new TraceInputError('size');
  const lines = csv.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  if (lines[0]?.trim() !== TRACE_HEADER) throw new TraceInputError('header');
  if (lines.length < 21 || lines.length > TRACE_MAX_SAMPLES + 1) throw new TraceInputError('count');
  /** @type {TraceSample[]} */
  const samples = [];
  const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((cell) => cell.trim());
    if (cells.length !== 4 || !['0', '1'].includes(cells[3]) || !decimal.test(cells[0]) || !decimal.test(cells[2]) || (cells[1] !== '' && !decimal.test(cells[1]))) throw new TraceInputError('row', i + 1);
    const time = Number(cells[0]);
    const target = Number(cells[2]);
    const valid = cells[3] === '1';
    const eye = cells[1] === '' ? null : Number(cells[1]);
    if (!Number.isFinite(time) || time < 0 || !Number.isFinite(target) || Math.abs(target) > 180 || (eye !== null && (!Number.isFinite(eye) || Math.abs(eye) > 180)) || (valid && eye === null)) throw new TraceInputError('row', i + 1);
    if (i > 1 && time <= samples[i - 2].time) throw new TraceInputError('time', i + 1);
    samples.push({ time, eye: valid ? eye : null, target, valid });
  }
  const duration = samples[samples.length - 1].time - samples[0].time;
  if (duration < 1000 || duration > 120000) throw new TraceInputError('duration');
  return samples;
}
/** @param {number[]} values */
function mean(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
/** @param {number[]} values */
function median(values) { const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; }

/** @param {TraceSample[]} samples */
function inspectTrace(samples) {
  const first = samples[0].time;
  const last = samples[samples.length - 1].time;
  const intervals = samples.slice(1).map((point, i) => point.time - samples[i].time);
  const valid = samples.filter((point) => point.valid);
  let previous = first;
  let maxGapMs = 0;
  for (const point of valid) { maxGapMs = Math.max(maxGapMs, point.time - previous); previous = point.time; }
  maxGapMs = Math.max(maxGapMs, last - previous);
  const sampleHz = 1000 / median(intervals);
  const validRatio = valid.length / samples.length;
  // Engineering gates for finite-difference analysis, not a tracking quality score.
  const ready = sampleHz >= 20 && validRatio >= 0.8 && maxGapMs <= 250;
  return { durationMs: last - first, sampleCount: samples.length, sampleHz, validRatio, maxGapMs, ready };
}

/** @param {TraceSample[]} samples */
function intervalsFor(samples) {
  return samples.slice(1).map((point, i) => {
    const previous = samples[i];
    const dt = (point.time - previous.time) / 1000;
    const usable = previous.valid && point.valid && previous.eye !== null && point.eye !== null && dt <= 0.1;
    return { start: previous.time, end: point.time, dt, usable, eyeVelocity: usable ? (Number(point.eye) - Number(previous.eye)) / dt : 0, targetVelocity: (point.target - previous.target) / dt };
  });
}

/** Analyze only explicit input. Never called with camera metadata or session durations.
 * @param {string} csv @param {'pursuit' | 'saccades'} mode */
export function analyzeEyeTrace(csv, mode) {
  if (!['pursuit', 'saccades'].includes(mode)) throw new TraceInputError('mode');
  const samples = parseEyeTrace(csv);
  const quality = inspectTrace(samples);
  const intervals = intervalsFor(samples);
  const valid = samples.filter((sample) => sample.valid);
  const rmseDeg = quality.ready ? Math.sqrt(valid.reduce((sum, p) => sum + (Number(p.eye) - p.target) ** 2, 0) / valid.length) : null;
  let pursuitGain = null;
  let gainDurationMs = 0;
  if (mode === 'pursuit' && quality.ready) {
    let numerator = 0;
    let denominator = 0;
    intervals.forEach((item, i) => {
      const rapid = intervals.slice(Math.max(0, i - 1), i + 2).some((neighbor) => neighbor.usable && Math.abs(neighbor.eyeVelocity) > 50);
      if (!item.usable || rapid || Math.abs(item.targetVelocity) < 0.5 || Math.abs(item.targetVelocity) > 40) return;
      numerator += item.eyeVelocity * item.targetVelocity * item.dt;
      denominator += item.targetVelocity ** 2 * item.dt;
      gainDurationMs += item.dt * 1000;
    });
    if (gainDurationMs >= 500 && denominator > 0) pursuitGain = numerator / denominator;
  }
  /** @type {{timeMs: number, latencyMs: number | null, peakVelocity: number | null, displacementGain: number | null, reason: string}[]} */
  const events = [];
  if (mode === 'saccades' && quality.ready) {
    const steps = intervals.map((item, i) => ({ item, i })).filter(({ item, i }) => item.dt <= 0.1 && Math.abs(samples[i + 1].target - samples[i].target) >= 2);
    // Reject ramps/drifting targets: detecting target onsets in those traces is ambiguous.
    const stepIndices = new Set(steps.map((step) => step.i));
    const discrete = intervals.every((item, i) => Math.abs(samples[i + 1].target - samples[i].target) < 0.000001 || stepIndices.has(i));
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      const index = steps[stepIndex].i + 1;
      const cue = samples[index];
      const amplitude = cue.target - samples[index - 1].target;
      const end = Math.min(cue.time + 1000, stepIndex + 1 < steps.length ? samples[steps[stepIndex + 1].i + 1].time : samples[samples.length - 1].time);
      /** @type {{timeMs: number, latencyMs: number | null, peakVelocity: number | null, displacementGain: number | null, reason: string}} */
      const event = { timeMs: cue.time - samples[0].time, latencyMs: null, peakVelocity: null, displacementGain: null, reason: 'no-response' };
      const baseline = intervals.filter((item) => item.end <= cue.time && item.start >= cue.time - 100);
      if (!discrete) { event.reason = 'target'; events.push(event); continue; }
      if (baseline.length < 2 || baseline[baseline.length - 1].end !== cue.time || baseline[0].start > cue.time - 50 || baseline.some((item) => !item.usable || Math.abs(item.eyeVelocity) >= 10)) { event.reason = 'baseline'; events.push(event); continue; }
      let onset = -1;
      let offset = -1;
      let peak = 0;
      let interrupted = false;
      for (let j = index; j < intervals.length && intervals[j].end < end; j++) {
        const item = intervals[j];
        if (!item.usable) { interrupted = true; break; }
        const directed = item.eyeVelocity * Math.sign(amplitude);
        if (onset < 0 && directed >= 30) {
          const next = intervals[j + 1];
          if (next?.usable && next.end < end && next.eyeVelocity * Math.sign(amplitude) >= 30) onset = j;
        }
        if (onset >= 0) {
          peak = Math.max(peak, Math.abs(item.eyeVelocity));
          if (Math.abs(item.eyeVelocity) < 15) { offset = j; break; }
        } else if (directed <= -30) { event.reason = 'direction'; interrupted = true; break; }
      }
      if (interrupted) event.reason = event.reason === 'direction' ? 'direction' : 'missing';
      else if (onset >= 0 && offset >= 0) {
        event.latencyMs = intervals[onset].start - cue.time;
        event.peakVelocity = peak;
        event.displacementGain = (Number(samples[offset].eye) - Number(samples[index].eye)) / amplitude;
        event.reason = '';
      } else if (onset >= 0) event.reason = 'incomplete';
      events.push(event);
    }
  }
  const accepted = events.filter((event) => !event.reason);
  return {
    algorithm: TRACE_ALGORITHM, mode, samples, quality, rmseDeg, pursuitGain, gainDurationMs, events,
    latencyMs: mean(accepted.map((event) => Number(event.latencyMs))),
    peakVelocity: mean(accepted.map((event) => Number(event.peakVelocity))),
    displacementGain: mean(accepted.map((event) => Number(event.displacementGain))),
    acceptedCount: accepted.length,
  };
}

/** Deterministic fixture with known numerical answers; never patient data.
 * @param {'pursuit' | 'saccades'} mode */
export function exampleEyeTrace(mode) {
  const rows = [TRACE_HEADER];
  for (let time = 0; time <= 4000; time += 10) {
    let target;
    let eye;
    if (mode === 'pursuit') {
      target = time <= 2000 ? -10 + time / 100 : 10 - (time - 2000) / 100;
      eye = target * 0.8;
    } else {
      target = time < 1000 ? 0 : time < 2500 ? 10 : -10;
      if (time < 1200) eye = 0;
      else if (time < 1280) eye = (time - 1200) / 8;
      else if (time < 2700) eye = 10;
      else if (time < 2780) eye = 10 - (time - 2700) / 4;
      else eye = -10;
    }
    rows.push(`${time},${eye.toFixed(4)},${target.toFixed(4)},1`);
  }
  return rows.join('\n');
}

/** Chart segments retain gaps; cap UI work without joining over discarded samples.
 * @param {TraceSample[]} samples @param {'eye' | 'target'} field @param {number} [maxPoints] */
export function traceSegments(samples, field, maxPoints = 300) {
  /** @type {{time: number, value: number}[][]} */
  const segments = [];
  /** @type {{time: number, value: number}[]} */
  let current = [];
  const flush = () => { if (current.length) segments.push(current); current = []; };
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (i && sample.time - samples[i - 1].time > 100) flush();
    const value = sample[field];
    if (value === null) { flush(); continue; }
    current.push({ time: sample.time, value });
  }
  flush();
  const stride = Math.max(1, Math.ceil(samples.length / maxPoints));
  // Keep each bucket's extrema as well as endpoints so short peaks stay visible.
  const segmentStride = Math.max(1, Math.ceil(segments.length / (maxPoints / 2)));
  return segments.filter((_, i) => i % segmentStride === 0).map((segment) => {
    const keep = new Set([0, segment.length - 1]);
    for (let start = 0; start < segment.length; start += stride) {
      let low = start; let high = start;
      for (let j = start; j < Math.min(segment.length, start + stride); j++) {
        if (segment[j].value < segment[low].value) low = j;
        if (segment[j].value > segment[high].value) high = j;
      }
      keep.add(low); keep.add(high);
    }
    return [...keep].sort((a, b) => a - b).map((i) => segment[i]);
  });
}

/** @param {TraceSample[]} samples */
export function traceChartDomain(samples) {
  const values = samples.flatMap((point) => point.eye === null ? [point.target] : [point.eye, point.target]);
  const min = Math.min(...values); const max = Math.max(...values);
  const padding = Math.max(1, (max - min) * 0.1);
  return { min: min - padding, max: max + padding, start: samples[0].time, end: samples[samples.length - 1].time };
}
