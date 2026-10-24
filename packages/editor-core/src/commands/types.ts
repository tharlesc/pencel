import type { Dimensions, ElementId, Position, PresetId } from '@pencel/shared-types';
import type { GraphicElement } from '../document/types.js';

/**
 * Discriminated union of conceptual editor commands.
 * Note: Full command execution and undo/redo dispatching are scheduled for the next phase.
 */
export type EditorCommand =
  | {
      readonly type: 'document/set-title';
      readonly title: string;
    }
  | {
      readonly type: 'document/set-preset';
      readonly presetId: PresetId;
    }
  | {
      readonly type: 'page/set-dimensions';
      readonly dimensions: Dimensions;
    }
  | {
      readonly type: 'page/set-background';
      readonly backgroundColor: string;
    }
  | {
      readonly type: 'element/add';
      readonly element: GraphicElement;
    }
  | {
      readonly type: 'element/move';
      readonly elementId: ElementId;
      readonly position: Position;
    }
  | {
      readonly type: 'element/remove';
      readonly elementId: ElementId;
    };
