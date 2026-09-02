/**
 * Parseo del código del DNI argentino (PDF417 del dorso o QR).
 * Formato RENAPER, campos separados por "@":
 * trámite @ apellido @ nombre @ sexo @ DNI @ ejemplar @ fecha nacimiento @ fecha emisión [@ CUIL]
 */
export type DniPdf417Data = {
  apellidos: string;
  nombres: string;
  documentNumber: string;
  sexo: "M" | "F";
  fechaNacimiento: string;
  fechaEmision: string;
  cuil: string | null;
};

const CAMPO_SEPARADOR = "@";
const CANTIDAD_MINIMA_CAMPOS = 8;

export function parseDniQr(rawData: string): DniPdf417Data | null {
  if (!rawData || typeof rawData !== "string") {
    return null;
  }

  const fields = rawData.trim().split(CAMPO_SEPARADOR);

  if (fields.length < CANTIDAD_MINIMA_CAMPOS) {
    return null;
  }

  const [, apellidosRaw, nombresRaw, sexoRaw, documentNumberRaw, , fechaNacimiento, fechaEmision, cuilRaw] =
    fields;

  const apellidos = apellidosRaw?.trim();
  const nombres = nombresRaw?.trim();
  const documentNumber = documentNumberRaw?.replace(/\D/g, "") ?? "";
  const sexo = sexoRaw?.trim().toUpperCase();

  if (!apellidos || !nombres) {
    return null;
  }

  if (!documentNumber || !/^\d+$/.test(documentNumber)) {
    return null;
  }

  if (sexo !== "M" && sexo !== "F") {
    return null;
  }

  const cuilDigits = cuilRaw?.replace(/\D/g, "") ?? "";
  const cuil = cuilDigits.length === 11 ? cuilDigits : null;

  return {
    apellidos,
    nombres,
    documentNumber,
    sexo,
    fechaNacimiento: fechaNacimiento?.trim() ?? "",
    fechaEmision: fechaEmision?.trim() ?? "",
    cuil,
  };
}
