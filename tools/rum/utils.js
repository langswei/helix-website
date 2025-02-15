/* helpers */
export function scoreValue(value, ni, poor) {
  if (value >= poor) return 'poor';
  if (value >= ni) return 'ni';
  return 'good';
}

export function scoreCWV(value, name) {
  if (!value) return null;
  const limits = {
    lcp: [2500, 4000],
    cls: [0.1, 0.25],
    inp: [200, 500],
    ttfb: [800, 1800],
  };
  return scoreValue(value, ...limits[name]);
}
export const UA_KEY = 'userAgent';
export function toHumanReadable(num) {
  const dp = 3;
  let number = num;
  const thresh = 1000;

  if (Math.abs(num) < thresh) {
    const precision = (Math.log10(number) < 0) ? 2 : (dp - 1) - Math.floor(Math.log10(number));
    return `${number.toFixed(precision)}`;
  }

  const units = ['k', 'm', 'g', 't', 'p'];
  let u = -1;
  const r = 10 ** dp;

  do {
    number /= thresh;
    u += 1;
  } while (Math.round(Math.abs(number) * r) / r >= thresh && u < units.length - 1);

  const precision = (dp - 1) - Math.floor(Math.log10(number));
  return `${number.toFixed(precision)}${units[u]}`;
} export function toISOStringWithTimezone(date) {
  // Pad a number to 2 digits
  const pad = (n) => `${Math.floor(Math.abs(n))}`.padStart(2, '0');

  // Get timezone offset in ISO format (+hh:mm or -hh:mm)
  const getTimezoneOffset = () => {
    const tzOffset = -date.getTimezoneOffset();
    const diff = tzOffset >= 0 ? '+' : '-';
    return `${diff}${pad(tzOffset / 60)}:${pad(tzOffset % 60)}`;
  };

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${getTimezoneOffset()}`;
}
export function scoreBundle(bundle) {
  // a bundle is good if all CWV that have a value are good
  // a bundle is ni if all CWV that have a value are ni or good
  // a bundle is poor if any CWV that have a value are poor
  // a bundle has no CWV if no CWV have a value
  const cwv = ['cwvLCP', 'cwvCLS', 'cwvINP'];
  const scores = cwv
    .filter((metric) => bundle[metric])
    .map((metric) => scoreCWV(bundle[metric], metric.toLowerCase().slice(3)));
  if (scores.length === 0) return null;
  if (scores.every((s) => s === 'good')) return 'good';
  if (scores.every((s) => s !== 'poor')) return 'ni';
  return 'poor';
}

export const INTERPOLATION_THRESHOLD = 10;
export function cwvInterpolationFn(targetMetric, interpolateTo100) {
  return (cwvs) => {
    const valueCount = cwvs.goodCWV.count + cwvs.niCWV.count + cwvs.poorCWV.count;
    const valuedWeights = cwvs.goodCWV.weight + cwvs.niCWV.weight + cwvs.poorCWV.weight;
    if (interpolateTo100) {
      return (cwvs[targetMetric].weight / valuedWeights);
    }
    if (valueCount < INTERPOLATION_THRESHOLD) {
      // not enough data to interpolate
      return 0;
    }
    // total weight
    const totalWeight = cwvs.goodCWV.weight
      + cwvs.niCWV.weight
      + cwvs.poorCWV.weight
      + cwvs.noCWV.weight;
    // share of targetMetric compared to all CWV
    const share = cwvs[targetMetric].weight / (valuedWeights);
    // interpolate the share to the total weight
    return Math.round(share * totalWeight);
  };
}

export function truncate(time, unit) {
  const t = new Date(time);
  // truncate to the beginning of the hour
  t.setMinutes(0);
  t.setSeconds(0);
  // truncate to the beginning of the day
  if (unit !== 'hour') t.setHours(0);
  // truncate to the beginning of the week, if the unit is week
  if (unit === 'week') t.setDate(t.getDate() - t.getDay());
  // truncate to the beginning of the month, if the unit is month
  if (unit === 'month') t.setDate(1);
  return toISOStringWithTimezone(t);
}

export function escapeHTML(unsafe) {
  return unsafe.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function cssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

let gradient;
let width;
let height;
export function getGradient(ctx, chartArea, from, to) {
  const chartWidth = chartArea.right - chartArea.left;
  const chartHeight = chartArea.bottom - chartArea.top;
  if (!gradient || width !== chartWidth || height !== chartHeight) {
    // Create the gradient because this is either the first render
    // or the size of the chart has changed
    width = chartWidth;
    height = chartHeight;
    gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
  }

  return gradient;
}
