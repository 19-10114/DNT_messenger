/**
 * Reglas y avisos de la identidad de una moto comprada a Empire.
 *
 * Las reglas bloquean (faltan datos o son imposibles). Los avisos no: señalan
 * lo que suele ser un error de tipeo para que se mire dos veces en la
 * revisión final, sin impedir un caso real que no siga el patrón.
 */

/** Más cortos son marcadores ("0", "N/A"), no seriales; igual que el backend. */
export const MIN_SERIAL_LENGTH = 5;
/** Un VIN (número de chasis) estándar. */
export const VIN_LENGTH = 17;
const FIRST_VALID_YEAR = 2000;

export interface BikeIdentityFields {
  plate: string;
  color: string;
  chassisSerial: string;
  motorSerial: string;
  year: string;
}

/** Como lo compara el backend: sin espacios y en mayúsculas. */
export function normalizeSerial(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, '').toUpperCase();
}

/** Errores que impiden agregar la moto, por campo. */
export function validateBikeIdentity(
  form: BikeIdentityFields
): Partial<Record<keyof BikeIdentityFields, string>> {
  const errors: Partial<Record<keyof BikeIdentityFields, string>> = {};
  const maxYear = new Date().getFullYear() + 1;
  if (!form.plate.trim()) errors.plate = 'La placa es obligatoria';
  if (!form.color) errors.color = 'Elija el color';
  if (normalizeSerial(form.chassisSerial).length < MIN_SERIAL_LENGTH)
    errors.chassisSerial = `Mínimo ${MIN_SERIAL_LENGTH} caracteres`;
  if (normalizeSerial(form.motorSerial).length < MIN_SERIAL_LENGTH)
    errors.motorSerial = `Mínimo ${MIN_SERIAL_LENGTH} caracteres`;
  const year = Number(form.year);
  if (!/^\d{4}$/.test(form.year) || year < FIRST_VALID_YEAR || year > maxYear)
    errors.year = `Año entre ${FIRST_VALID_YEAR} y ${maxYear}`;
  return errors;
}

/** Cuántos caracteres difieren entre dos seriales del mismo largo. */
function differingCharacters(a: string, b: string): number {
  if (a.length !== b.length) return Infinity;
  let count = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) count += 1;
  return count;
}

/**
 * Avisos de una moto frente a las demás del carrito.
 * @param others - Las otras motos del carrito, con su placa para nombrarlas
 */
export function bikeIdentityWarnings(
  bike: BikeIdentityFields,
  others: BikeIdentityFields[]
): string[] {
  const warnings: string[] = [];
  const chassis = normalizeSerial(bike.chassisSerial);
  const motor = normalizeSerial(bike.motorSerial);

  if (chassis && chassis.length !== VIN_LENGTH) {
    warnings.push(
      `El chasis tiene ${chassis.length} caracteres; un VIN tiene ${VIN_LENGTH}.`
    );
  }
  const forbidden = Array.from(new Set(chassis.match(/[IOQ]/g) ?? []));
  if (forbidden.length) {
    warnings.push(
      `El chasis tiene ${forbidden.join(', ')}: los VIN no usan I, O ni Q (¿es 1 o 0?).`
    );
  }
  if (Number(bike.year) > new Date().getFullYear()) {
    warnings.push(`Año ${bike.year}: posterior al año en curso.`);
  }
  others.forEach((other) => {
    if (
      differingCharacters(chassis, normalizeSerial(other.chassisSerial)) === 1
    ) {
      warnings.push(
        `Chasis casi igual al de la moto ${other.plate}: confirme que no es la misma.`
      );
    }
    if (differingCharacters(motor, normalizeSerial(other.motorSerial)) === 1) {
      warnings.push(
        `Motor casi igual al de la moto ${other.plate}: confirme que no es la misma.`
      );
    }
  });
  return warnings;
}

/** El VIN con los últimos 6 (el número de serie de fábrica) separados, para cotejar con la calcomanía. */
export function splitChassisForReading(value: string): [string, string] {
  const chassis = normalizeSerial(value);
  if (chassis.length <= 6) return ['', chassis];
  return [chassis.slice(0, -6), chassis.slice(-6)];
}
