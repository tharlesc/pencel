import type { ElementId } from '@pencel/shared-types';

export type SidebarCategory =
  | 'design'
  | 'elements'
  | 'text'
  | 'media'
  | 'background'
  | 'layers'
  | 'cameraRaw'
  | 'uploads'
  | 'ai'
  | 'settings';

export type EditorToolMode = 'select' | 'text' | 'shape' | 'image';

export type EngineLifecycleState = 'initializing' | 'ready' | 'fallback' | 'disposed';

export interface EditorSelectionState {
  readonly activeTool: EditorToolMode;
  readonly selectedElementIds: readonly ElementId[];
}
