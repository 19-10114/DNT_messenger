import React from 'react';

export interface ColorCirclesItem {
  color: string;
  /** El backend puede devolverlo vacío: ver `NO_COLOR_STYLE`. */
  colorHex?: string | null;
  quantity: number;
}

interface ColorCirclesProps {
  colors: ColorCirclesItem[];
}

const CIRCLE_BORDER = '1px solid rgb(209 213 219)';

/**
 * Damero gris y blanco, la convención de "sin color" (el fondo transparente de
 * un PNG). Se lee como ausencia de dato y no como un error, que es lo que
 * pasaba cuando estos círculos se pintaban de rojo.
 */
const NO_COLOR_STYLE: React.CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage: [
    'linear-gradient(45deg, #d1d5db 25%, transparent 25%)',
    'linear-gradient(-45deg, #d1d5db 25%, transparent 25%)',
    'linear-gradient(45deg, transparent 75%, #d1d5db 75%)',
    'linear-gradient(-45deg, transparent 75%, #d1d5db 75%)',
  ].join(', '),
  backgroundSize: '6px 6px',
  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0',
  border: CIRCLE_BORDER,
};

/** Colores de un modelo con su cantidad, como círculos. */
export function ColorCircles({ colors }: ColorCirclesProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {colors.map((colorItem, index) => (
        <div key={index} className="flex items-center gap-1">
          <div
            className="h-4 w-4 shrink-0 rounded-full"
            style={
              colorItem.colorHex
                ? { backgroundColor: colorItem.colorHex, border: CIRCLE_BORDER }
                : NO_COLOR_STYLE
            }
            title={`${colorItem.color || 'Sin color'}: ${colorItem.quantity}`}
          />
          <span className="text-xs">{colorItem.quantity}</span>
        </div>
      ))}
    </div>
  );
}
