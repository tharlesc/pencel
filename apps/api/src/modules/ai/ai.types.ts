export type LayoutStyleTheme =
  'tech' | 'promo' | 'minimal' | 'elegant' | 'vibrant' | 'bold' | 'dark';

export interface GenerateLayoutOptions {
  readonly prompt: string;
  readonly style?: LayoutStyleTheme;
  readonly dimensions?: { readonly width: number; readonly height: number };
  readonly presetId?: string;
  readonly apiKey?: string;
  readonly provider?: 'gemini' | 'openai' | 'claude' | 'deepseek';
  readonly model?: string;
}

export interface CanvasLayoutElementDto {
  readonly id: string;
  readonly type: 'rect' | 'circle' | 'triangle' | 'textbox';
  readonly left: number;
  readonly top: number;
  readonly width?: number;
  readonly height?: number;
  readonly radius?: number;
  readonly rx?: number;
  readonly ry?: number;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
  readonly text?: string;
  readonly fontSize?: number;
  readonly fontFamily?: string;
  readonly fontWeight?: 'normal' | 'bold' | 400 | 500 | 600 | 700 | 800 | 900;
  readonly textAlign?: 'left' | 'center' | 'right';
  readonly name: string;
}

export interface GeneratedLayoutDto {
  readonly title: string;
  readonly backgroundColor: string;
  readonly elements: readonly CanvasLayoutElementDto[];
  readonly explanation: string;
}

export interface GenerateLayoutResponse {
  readonly success: boolean;
  readonly layout?: GeneratedLayoutDto;
  readonly error?: string;
}
