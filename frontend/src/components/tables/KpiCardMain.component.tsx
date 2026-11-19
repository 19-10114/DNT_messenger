// Tarjeta grande de KPI, compartida entre PartsReportTable (Ingreso/Costo/
// Utilidad/Margen) y PaymentMethodsSection (totales USD/Bs), para que ambas
// sección se vean del mismo tamaño.
export function KpiCardMain({
  label,
  value,
  subtitle,
  tone = 'default',
  onClick,
  actionHint,
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: 'default' | 'green' | 'red' | 'brown';
  /** Vuelve la tarjeta un botón (p. ej. abrir un desglose). */
  onClick?: () => void;
  /** Texto pequeño al pie cuando es clickeable, p. ej. "Ver desglose". */
  actionHint?: string;
}) {
  const textClass =
    tone === 'green'
      ? 'text-green-600'
      : tone === 'red'
        ? 'text-red-600'
        : tone === 'brown'
          ? 'text-amber-800'
          : 'text-gray-800';
  const borderClass =
    tone === 'green'
      ? 'border-l-4 border-green-600'
      : tone === 'red'
        ? 'border-l-4 border-red-500'
        : tone === 'brown'
          ? 'border-l-4 border-amber-800'
          : 'border-l-4 border-secondary';
  const className = `bg-white rounded-xl shadow-sm ${borderClass} px-5 py-4 flex flex-col gap-1`;
  const content = (
    <>
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-xl font-bold ${textClass}`}>{value}</span>
      {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
      {onClick && actionHint && (
        <span className="text-xs font-medium text-secondary">{actionHint}</span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${className} text-left transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary`}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
