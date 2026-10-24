let sequenceCounter = 0;

export function createElementId(prefix: string): string {
  sequenceCounter = (sequenceCounter + 1) % 10000;
  return `${prefix}-${Date.now()}-${sequenceCounter}`;
}
