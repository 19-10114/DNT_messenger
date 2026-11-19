import { BlockType } from '@/services/pages/types';
import { PageBlockPayload } from '@/services/pages/types';

export type EditableBlock<T extends BlockType> = Extract<
  PageBlockPayload,
  { type: T }
>;

export interface BlockEditorProps<T extends BlockType> {
  /** Clave del bloque en el borrador, para ids de los campos */
  blockKey: string;
  block: EditableBlock<T>;
  onChange: (block: EditableBlock<T>) => void;
}
