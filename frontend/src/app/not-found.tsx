import Link from 'next/link';

// /not-found.tsx
export default function NotFound() {
  return (
    <section className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center bg-white p-10 rounded-lg shadow-lg max-w-md">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Hubo un error</h1>
        <p className="text-lg text-gray-700 mb-6">
          No hay resultados en tu búsqueda.
        </p>
        <p className="text-gray-600 mb-4">
          Por favor, regresa al inicio o contacta al administrador para más
          información.
        </p>
        <Link
          href="/"
          className="inline-block bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-500 transition-all duration-300"
        >
          Volver al Inicio
        </Link>
      </div>
    </section>
  );
}
