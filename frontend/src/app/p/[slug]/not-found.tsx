import Link from 'next/link';

import { HOME } from '@/constants/routes';

/** Página inexistente, en borrador o vencida: nada indica cuál de las tres */
export default function PublicPageNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#faf8f5] px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/moto-candela-logo.svg"
        alt="Moto Candela"
        className="h-12 w-auto"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
          Esta página ya no está disponible
        </h1>
        <p className="text-neutral-500">
          Puede que la promoción haya terminado o que el enlace haya cambiado.
        </p>
      </div>
      <Link
        href={HOME}
        className="rounded-full bg-[#ff8635] px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
      >
        Ir a Moto Candela
      </Link>
    </main>
  );
}
