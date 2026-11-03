export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function roundTo(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Safely evaluates basic mathematical arithmetic expressions (e.g. "1080*3", "1920/2", "800+200", "1000-50")
 * for dimension inputs, without using dangerous eval() or Function constructors.
 */
export function evaluateDimensionExpression(input: string, fallback: number): number {
  const clean = input.trim().replace(/\s+/g, '');
  if (!clean) return fallback;

  if (/^\d+(?:\.\d+)?$/.test(clean)) {
    const val = Number.parseFloat(clean);
    return Number.isFinite(val) ? Math.max(1, Math.round(val)) : fallback;
  }

  if (!/^[\d.+\-*/]+$/.test(clean)) {
    const parsed = Number.parseFloat(clean);
    return Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : fallback;
  }

  try {
    const tokens = clean.match(/\d+(?:\.\d+)?|[+\-*/]/g);
    if (!tokens) return fallback;

    // Handle multiplication and division first
    const intermediate: (number | string)[] = [];
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === '*' || token === '/') {
        const prev = intermediate.pop();
        const next = tokens[i + 1];
        if (typeof prev !== 'number' || !next || Number.isNaN(Number(next))) return fallback;
        const numNext = Number(next);
        const result = token === '*' ? prev * numNext : numNext !== 0 ? prev / numNext : prev;
        intermediate.push(result);
        i += 2;
      } else if (token && !Number.isNaN(Number(token))) {
        intermediate.push(Number(token));
        i++;
      } else if (token) {
        intermediate.push(token);
        i++;
      }
    }

    // Handle addition and subtraction
    let total = typeof intermediate[0] === 'number' ? intermediate[0] : 0;
    let j = typeof intermediate[0] === 'number' ? 1 : 0;
    while (j < intermediate.length) {
      const op = intermediate[j];
      const nextVal = intermediate[j + 1];
      if (typeof nextVal === 'number') {
        if (op === '+') total += nextVal;
        else if (op === '-') total -= nextVal;
      }
      j += 2;
    }

    return Number.isFinite(total) ? Math.max(1, Math.round(total)) : fallback;
  } catch {
    return fallback;
  }
}
