export function isSvgSource(url: string): boolean {
  return url.toLowerCase().includes('.svg') || url.startsWith('data:image/svg+xml');
}

export function decodeSvgDataUri(dataUri: string): string {
  return decodeURIComponent(dataUri.replace(/^data:image\/svg\+xml;[^,]*,/, ''));
}

export function normalizeSvgMarkup(svgText: string, defaultFill = '#18181B'): string {
  let normalized = svgText.replace(/currentColor/g, defaultFill);
  if (!/\bwidth=/.test(normalized)) {
    normalized = normalized.replace('<svg', '<svg width="512" height="512"');
  }
  return normalized;
}

export function encodeSvgDataUri(svgText: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
}
