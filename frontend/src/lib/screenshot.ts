/**
 * Captura de lo que se ve en la ventana, para adjuntarla a un reporte de
 * soporte. Dibuja el DOM con `html2canvas`: no es una foto del sistema sino
 * una reconstrucción, así que no pide permisos ni interrumpe al usuario, pero
 * una imagen de otro dominio sin CORS sale en blanco.
 */

/** Ancho máximo de la captura; en retina evita imágenes de 2700 px */
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.82;

/** Marca elementos que no deben salir en la captura (el propio modal) */
export const SCREENSHOT_IGNORE_ATTRIBUTE = 'data-screenshot-ignore';

function shouldIgnore(element: Element): boolean {
  return (
    element.hasAttribute(SCREENSHOT_IGNORE_ATTRIBUTE) ||
    element.getAttribute('role') === 'dialog' ||
    // Menús flotantes de Radix (p. ej. el de "Soporte" cerrándose)
    element.hasAttribute('data-radix-popper-content-wrapper')
  );
}

/**
 * Captura la parte visible de la página como JPEG. Devuelve `null` si no se
 * pudo (navegador sin soporte, canvas contaminado, error de render): la
 * captura es un extra, nunca debe bloquear el reporte.
 */
export async function captureViewport(): Promise<File | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { default: html2canvas } = await import('html2canvas');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, MAX_WIDTH / width);

    const canvas = await html2canvas(document.body, {
      x: window.scrollX,
      y: window.scrollY,
      width,
      height,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
      scale,
      useCORS: true,
      logging: false,
      ignoreElements: shouldIgnore,
      backgroundColor: '#ffffff',
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob) return null;
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    return new File([blob], `pantalla-${stamp}.jpg`, { type: 'image/jpeg' });
  } catch {
    return null;
  }
}
