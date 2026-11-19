import { useEffect } from 'react';

/**
 * Una imagen pegada con Ctrl+V (captura o foto en el portapapeles) entra como
 * si se hubiera elegido el archivo. Solo mientras `enabled`: el modal abierto y
 * esperando un archivo. Un pegado sin imagen no hace nada.
 */
export function usePasteImage(enabled: boolean, onFile: (file: File) => void) {
  useEffect(() => {
    if (!enabled) return;
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) =>
        entry.type.startsWith('image/')
      );
      const blob = item?.getAsFile();
      if (!blob) return;
      event.preventDefault();
      const extension = blob.type.split('/')[1] || 'png';
      onFile(
        new File([blob], `pegado-${Date.now()}.${extension}`, {
          type: blob.type,
        })
      );
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [enabled, onFile]);
}
