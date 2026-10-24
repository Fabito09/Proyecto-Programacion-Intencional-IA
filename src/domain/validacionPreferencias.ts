// Validación de nombre, horario de trabajo y recordatorios (RF-INI-02, RF-INI-03, RF-AJU-04, RF-AJU-05).
import {
  DIAS_SEMANA,
  LIMITES,
  type FranjaRecordatorio,
  type HoraDelDia,
  type HorarioTrabajo,
} from './modelo';
import { MENSAJES } from './mensajes';
import { exito, fallo, tieneErrores, type ErroresDeCampo, type Resultado } from './resultado';
import { esHoraValida, horaAMinutos } from './tiempo';

/** RF-INI-02 */
export function validarNombre(nombre: string): Resultado<string, 'nombre'> {
  const limpio = nombre.trim();
  if (limpio === '') return fallo({ nombre: MENSAJES.nombreObligatorio });
  if (limpio.length > LIMITES.nombreUsuarioMaximo) {
    return fallo({ nombre: MENSAJES.maximoCaracteres(LIMITES.nombreUsuarioMaximo) });
  }
  return exito(limpio);
}

export type CampoHorario = 'dias' | 'entrada' | 'salida';

export interface BorradorHorario {
  dias: string[];
  entrada: string;
  salida: string;
}

/** RF-INI-03 */
export function validarHorario(borrador: BorradorHorario): Resultado<HorarioTrabajo, CampoHorario> {
  const errores: ErroresDeCampo<CampoHorario> = {};
  const diasLaborales = DIAS_SEMANA.filter((dia) => borrador.dias.includes(dia));
  const { entrada, salida } = borrador;

  if (diasLaborales.length === 0) errores.dias = MENSAJES.marqueUnDia;
  if (!esHoraValida(entrada)) errores.entrada = MENSAJES.indiqueEntrada;
  if (!esHoraValida(salida)) errores.salida = MENSAJES.indiqueSalida;
  else if (esHoraValida(entrada) && horaAMinutos(salida) <= horaAMinutos(entrada)) {
    errores.salida = MENSAJES.salidaDespuesDeEntrada;
  }

  if (tieneErrores(errores) || !esHoraValida(entrada) || !esHoraValida(salida)) return fallo(errores);
  return exito({ diasLaborales, entrada, salida });
}

export interface BorradorRecordatorios {
  principal: string;
  secundario: string;
}

export type HorasRecordatorio = Record<FranjaRecordatorio, HoraDelDia | null>;

/** Casilla vacía = null ("Ninguno"); undefined si el valor no es una hora válida. */
function leerHoraOpcional(texto: string): HoraDelDia | null | undefined {
  const limpio = texto.trim();
  if (limpio === '') return null;
  return esHoraValida(limpio) ? limpio : undefined;
}

/** RF-AJU-04, RF-AJU-05 */
export function validarRecordatorios(borrador: BorradorRecordatorios): Resultado<HorasRecordatorio, FranjaRecordatorio> {
  const errores: ErroresDeCampo<FranjaRecordatorio> = {};
  const principal = leerHoraOpcional(borrador.principal);
  const secundario = leerHoraOpcional(borrador.secundario);

  if (principal === undefined) errores.principal = MENSAJES.horaInvalida;
  if (secundario === undefined) errores.secundario = MENSAJES.horaInvalida;
  else if (secundario !== null && secundario === principal) errores.secundario = MENSAJES.recordatoriosIguales;

  if (tieneErrores(errores) || principal === undefined || secundario === undefined) return fallo(errores);
  return exito({ principal, secundario });
}
