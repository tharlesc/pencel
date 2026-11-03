import { FabricImage, classRegistry, filters, type Canvas as FabricCanvas } from 'fabric';

export const vignetteFragmentSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uAmount;
  uniform float uMidpoint;
  uniform float uRoundness;
  uniform float uFeather;
  varying vec2 vTexCoord;

  void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    vec2 coord = (vTexCoord - 0.5) * 2.0;

    float roundnessFactor = 1.0 + uRoundness;
    float rx = (uRoundness > 0.0) ? roundnessFactor : 1.0;
    float ry = (uRoundness < 0.0) ? (1.0 / max(0.1, roundnessFactor)) : (uRoundness == 0.0 ? 1.0 : roundnessFactor);

    coord.x /= rx;
    coord.y /= ry;
    float dist = length(coord);

    float midRatio = clamp(uMidpoint, 0.05, 0.95);
    float featherRatio = clamp(uFeather, 0.05, 1.0);
    float innerR = midRatio * (1.0 - featherRatio * 0.5);
    float outerR = min(1.6, midRatio + featherRatio * 0.8);

    if (dist > innerR) {
      float t = clamp((dist - innerR) / max(0.001, outerR - innerR), 0.0, 1.0);
      float factor = max(0.0, 1.0 + uAmount * (t * t));
      color.rgb *= factor;
    }
    gl_FragColor = color;
  }
`;

export const grainFragmentSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uStepH;
  uniform float uAmount;
  uniform float uSeed;
  varying vec2 vTexCoord;

  float rand(vec2 co, float seed, float scale) {
    return fract(sin(dot(co.xy * scale, vec2(12.9898, 78.233))) * 43758.5453 * (seed + 0.01) / 2.0);
  }

  void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    float noise = (0.5 - rand(vTexCoord, uSeed, 0.1 / max(0.0001, uStepH))) * (uAmount * 1.5 / 255.0);
    color.rgb += noise;
    gl_FragColor = color;
  }
`;

export class CameraRawVignetteFilter extends filters.BaseFilter<string> {
  static override type = 'CameraRawVignette';
  static override uniformLocations = ['uAmount', 'uMidpoint', 'uRoundness', 'uFeather'];
  public amount = 0;
  public midpoint = 50;
  public roundness = 0;
  public feather = 50;

  constructor(options: {
    amount: number;
    midpoint?: number;
    roundness?: number;
    feather?: number;
  }) {
    super();
    this.amount = options.amount;
    this.midpoint = options.midpoint ?? 50;
    this.roundness = options.roundness ?? 0;
    this.feather = options.feather ?? 50;
  }

  override getFragmentSource(): string {
    return vignetteFragmentSource;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override sendUniformData(gl: WebGLRenderingContext, uniformLocations: any): void {
    gl.uniform1f(uniformLocations.uAmount, this.amount / 100);
    gl.uniform1f(uniformLocations.uMidpoint, this.midpoint / 100);
    gl.uniform1f(uniformLocations.uRoundness, this.roundness / 100);
    gl.uniform1f(uniformLocations.uFeather, this.feather / 100);
  }

  override applyTo2d(options: { imageData: ImageData }): void {
    if (this.amount === 0) return;
    const { data, width, height } = options.imageData;
    const cx = width / 2;
    const cy = height / 2;
    const roundnessFactor = 1 + this.roundness / 100;
    const rx = (width / 2) * (this.roundness > 0 ? roundnessFactor : 1);
    const ry =
      (height / 2) *
      (this.roundness < 0
        ? 1 / Math.max(0.1, roundnessFactor)
        : this.roundness === 0
          ? 1
          : roundnessFactor);

    const midRatio = Math.max(0.05, Math.min(0.95, this.midpoint / 100));
    const featherRatio = Math.max(0.05, Math.min(1, this.feather / 100));
    const innerRadius = midRatio * (1 - featherRatio * 0.5);
    const outerRadius = Math.min(1.6, midRatio + featherRatio * 0.8);
    const amt = this.amount / 100;

    for (let y = 0; y < height; y++) {
      const dy = (y - cy) / ry;
      const dy2 = dy * dy;
      const yRow = y * width * 4;
      for (let x = 0; x < width; x++) {
        const dx = (x - cx) / rx;
        const d = Math.sqrt(dx * dx + dy2);
        if (d > innerRadius) {
          const t = Math.min(1, (d - innerRadius) / Math.max(0.001, outerRadius - innerRadius));
          const factor = Math.max(0, 1 + amt * (t * t));
          const idx = yRow + x * 4;
          data[idx] = Math.min(255, (data[idx] ?? 0) * factor);
          data[idx + 1] = Math.min(255, (data[idx + 1] ?? 0) * factor);
          data[idx + 2] = Math.min(255, (data[idx + 2] ?? 0) * factor);
        }
      }
    }
  }
}

export class CameraRawGrainFilter extends filters.BaseFilter<string> {
  static override type = 'CameraRawGrain';
  static override uniformLocations = ['uAmount', 'uSeed', 'uStepH'];
  public amount = 0;
  public size = 25;

  constructor(options: { amount: number; size?: number }) {
    super();
    this.amount = options.amount;
    this.size = options.size ?? 25;
  }

  override getFragmentSource(): string {
    return grainFragmentSource;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override sendUniformData(gl: WebGLRenderingContext, uniformLocations: any): void {
    gl.uniform1f(uniformLocations.uAmount, this.amount);
    gl.uniform1f(uniformLocations.uSeed, Math.random());
    gl.uniform1f(uniformLocations.uStepH, 1 / 1024);
  }

  override applyTo2d(options: { imageData: ImageData }): void {
    if (this.amount <= 0) return;
    const { data, width, height } = options.imageData;
    const intensity = this.amount * 1.4;
    const step = Math.max(1, Math.round(this.size / 18));

    if (step <= 1) {
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity;
        data[i] = Math.min(255, Math.max(0, (data[i] ?? 0) + noise));
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] ?? 0) + noise));
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] ?? 0) + noise));
      }
    } else {
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const noise = (Math.random() - 0.5) * intensity;
          for (let dy = 0; dy < step && y + dy < height; dy++) {
            const rowOffset = (y + dy) * width * 4;
            for (let dx = 0; dx < step && x + dx < width; dx++) {
              const idx = rowOffset + (x + dx) * 4;
              data[idx] = Math.min(255, Math.max(0, (data[idx] ?? 0) + noise));
              data[idx + 1] = Math.min(255, Math.max(0, (data[idx + 1] ?? 0) + noise));
              data[idx + 2] = Math.min(255, Math.max(0, (data[idx + 2] ?? 0) + noise));
            }
          }
        }
      }
    }
  }
}

classRegistry.setClass(CameraRawVignetteFilter);
classRegistry.setClass(CameraRawGrainFilter);

export interface CameraRawAdjustments {
  readonly exposure: number; // -100 to 100
  readonly contrast: number; // -100 to 100
  readonly highlights: number; // -100 to 100
  readonly shadows: number; // -100 to 100
  readonly whites: number; // -100 to 100
  readonly blacks: number; // -100 to 100
  readonly temperature: number; // -100 (cool/azul) to 100 (warm/amarelo)
  readonly tint: number; // -100 (verde) to 100 (magenta)
  readonly vibrance: number; // -100 to 100
  readonly saturation: number; // -100 to 100
  readonly texture: number; // -100 to 100
  readonly clarity: number; // -100 to 100
  readonly dehaze: number; // -100 to 100
  readonly vignetteStyle?: 'highlightPriority' | 'colorPriority' | 'paintOverlay';
  readonly vignette: number; // -100 to 100
  readonly vignetteMidpoint: number; // 0 to 100 (default 50)
  readonly vignetteRoundness: number; // -100 to 100
  readonly vignetteFeather: number; // 0 to 100 (default 50)
  readonly vignetteHighlights: number; // 0 to 100
  readonly grainAmount: number; // 0 to 100
  readonly grainSize: number; // 0 to 100 (default 25)
}

export const DEFAULT_CAMERA_RAW_ADJUSTMENTS: CameraRawAdjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  texture: 0,
  clarity: 0,
  dehaze: 0,
  vignetteStyle: 'highlightPriority',
  vignette: 0,
  vignetteMidpoint: 50,
  vignetteRoundness: 0,
  vignetteFeather: 50,
  vignetteHighlights: 0,
  grainAmount: 0,
  grainSize: 25,
};

export function getCameraRawAdjustments(image: FabricImage): CameraRawAdjustments {
  const saved = image.get('cameraRawAdjustments') as CameraRawAdjustments | undefined;
  return saved
    ? { ...DEFAULT_CAMERA_RAW_ADJUSTMENTS, ...saved }
    : { ...DEFAULT_CAMERA_RAW_ADJUSTMENTS };
}

export function applyCameraRawToImage(image: FabricImage, adjustments: CameraRawAdjustments): void {
  const fList: unknown[] = [];

  // 1. Exposure & Whites: brightness
  const effExposure = adjustments.exposure + (adjustments.whites || 0) * 0.3;
  if (effExposure !== 0) {
    fList.push(new filters.Brightness({ brightness: effExposure / 200 }));
  }

  // 2. Contrast, Blacks, Texture & Dehaze: contrast
  const effContrast =
    adjustments.contrast +
    (adjustments.blacks || 0) * 0.3 +
    (adjustments.texture || 0) * 0.2 +
    (adjustments.dehaze || 0) * 0.3;
  if (effContrast !== 0) {
    fList.push(new filters.Contrast({ contrast: effContrast / 200 }));
  }

  // 3. Saturation & Dehaze: saturation
  const effSat = adjustments.saturation + (adjustments.dehaze || 0) * 0.2;
  if (effSat !== 0) {
    fList.push(new filters.Saturation({ saturation: effSat / 100 }));
  }

  // 4. Vibrance: -100..100 -> -1..1 vibrance
  if (adjustments.vibrance !== 0) {
    fList.push(new filters.Vibrance({ vibrance: adjustments.vibrance / 100 }));
  }

  // 5. Temperature & Tint: Color Matrix
  if (adjustments.temperature !== 0 || adjustments.tint !== 0) {
    const t = adjustments.temperature / 200; // -0.5 to 0.5
    const tint = adjustments.tint / 200; // -0.5 to 0.5
    const rMult = 1 + t + (tint > 0 ? tint * 0.4 : 0);
    const gMult = 1 - (tint > 0 ? tint * 0.4 : -tint * 0.4);
    const bMult = 1 - t + (tint > 0 ? tint * 0.4 : 0);

    fList.push(
      new filters.ColorMatrix({
        matrix: [rMult, 0, 0, 0, 0, 0, gMult, 0, 0, 0, 0, 0, bMult, 0, 0, 0, 0, 0, 1, 0],
      }),
    );
  }

  // 6. Highlights & Shadows: Gamma curve
  if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
    const shadowFactor = 1 - adjustments.shadows / 300;
    const highlightFactor = 1 + adjustments.highlights / 300;
    const avgGamma = Math.max(0.2, Math.min(2.5, (shadowFactor + highlightFactor) / 2));
    fList.push(new filters.Gamma({ gamma: [avgGamma, avgGamma, avgGamma] }));
  }

  // 7. Clarity: subtle contrast boost
  if (adjustments.clarity !== 0) {
    fList.push(new filters.Contrast({ contrast: adjustments.clarity / 400 }));
  }

  // 8. Vignette: Photographic Falloff (Photocraft filter.cameraRaw clone)
  if (adjustments.vignette !== 0) {
    fList.push(
      new CameraRawVignetteFilter({
        amount: adjustments.vignette,
        midpoint: adjustments.vignetteMidpoint,
        roundness: adjustments.vignetteRoundness,
        feather: adjustments.vignetteFeather,
      }),
    );
  }

  // 9. Grain: Film Grain Noise (Photocraft filter.cameraRaw clone)
  if (adjustments.grainAmount > 0) {
    fList.push(
      new CameraRawGrainFilter({
        amount: adjustments.grainAmount,
        size: adjustments.grainSize,
      }),
    );
  }

  image.set('cameraRawAdjustments', { ...adjustments });
  image.filters = fList as unknown as typeof image.filters;
  image.applyFilters();
}

export function resetCameraRawAdjustments(image: FabricImage): void {
  image.set('cameraRawAdjustments', { ...DEFAULT_CAMERA_RAW_ADJUSTMENTS });
  image.filters = [];
  image.applyFilters();
}

export function getActiveImageCameraRaw(fabricCanvas: FabricCanvas): CameraRawAdjustments | null {
  const active = fabricCanvas.getActiveObject();
  if (active instanceof FabricImage) {
    return getCameraRawAdjustments(active);
  }
  return null;
}

export function applyCameraRawToActiveImage(
  fabricCanvas: FabricCanvas,
  adjustments: CameraRawAdjustments,
  onComplete: () => void,
): boolean {
  const active = fabricCanvas.getActiveObject();
  if (active instanceof FabricImage) {
    applyCameraRawToImage(active, adjustments);
    fabricCanvas.requestRenderAll();
    onComplete();
    return true;
  }
  return false;
}
