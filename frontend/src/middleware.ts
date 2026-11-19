import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Obtener el token del usuario desde las cookies
  const token = request.cookies.get('token')?.value;

  // Verificar si la ruta empieza con /dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Sin token (sesión caducada o nunca iniciada) se vuelve al inicio, donde
    // el usuario entra con el modal de la landing. Se conserva la ruta
    // original en `next` para devolverlo ahí tras iniciar sesión.
    if (!token) {
      const home = new URL('/', request.url);
      home.searchParams.set(
        'next',
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      );
      return NextResponse.redirect(home);
    }
  }

  return NextResponse.next();
}

// Configurar las rutas protegidas
export const config = {
  matcher: [
    '/dashboard/:path*', // Protege todas las rutas que empiecen con /dashboard
  ],
};
