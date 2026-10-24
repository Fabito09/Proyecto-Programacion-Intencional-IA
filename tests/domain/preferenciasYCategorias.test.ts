import { describe, expect, it } from 'vitest';
import { validarCategoria } from '../../src/domain/validacionCategoria';
import { validarHorario, validarNombre, validarRecordatorios } from '../../src/domain/validacionPreferencias';
import { CATEGORIA_GENERAL } from '../fabricas';

describe('validarNombre (RF-INI-02)', () => {
  it('CB-32: rechaza un nombre vacío o con solo espacios', () => {
    expect(validarNombre('   ')).toEqual({ ok: false, errores: { nombre: 'El nombre es obligatorio' } });
  });

  it('rechaza más de 40 caracteres y limpia los espacios', () => {
    expect(validarNombre('a'.repeat(41)).ok).toBe(false);
    expect(validarNombre('  Ana  ')).toEqual({ ok: true, valor: 'Ana' });
  });
});

describe('validarHorario (RF-INI-03)', () => {
  it('CB-33: exige al menos un día y una salida posterior a la entrada', () => {
    const resultado = validarHorario({ dias: [], entrada: '17:00', salida: '08:00' });
    expect(resultado).toEqual({
      ok: false,
      errores: { dias: 'Marque al menos un día', salida: 'La salida debe ser después de la entrada' },
    });
  });

  it('pide las horas que faltan', () => {
    const resultado = validarHorario({ dias: ['lunes'], entrada: '', salida: '' });
    expect(resultado).toEqual({
      ok: false,
      errores: { entrada: 'Indique la hora de entrada', salida: 'Indique la hora de salida' },
    });
  });

  it('ordena los días de lunes a domingo e ignora valores desconocidos', () => {
    const resultado = validarHorario({ dias: ['viernes', 'feriado', 'lunes'], entrada: '08:00', salida: '17:00' });
    expect(resultado).toEqual({ ok: true, valor: { diasLaborales: ['lunes', 'viernes'], entrada: '08:00', salida: '17:00' } });
  });
});

describe('validarRecordatorios (RF-AJU-04, RF-AJU-05)', () => {
  it('CB-27: rechaza dos recordatorios a la misma hora', () => {
    expect(validarRecordatorios({ principal: '08:00', secundario: '08:00' })).toEqual({
      ok: false,
      errores: { secundario: 'Los dos recordatorios no pueden tener la misma hora' },
    });
  });

  it('CB-28: las casillas vacías se guardan como "Ninguno"', () => {
    expect(validarRecordatorios({ principal: '', secundario: ' ' })).toEqual({
      ok: true,
      valor: { principal: null, secundario: null },
    });
  });

  it('rechaza una hora inválida', () => {
    expect(validarRecordatorios({ principal: '25:00', secundario: '' })).toEqual({
      ok: false,
      errores: { principal: 'Hora inválida' },
    });
  });
});

describe('validarCategoria (RF-CAT-02, RF-CAT-04)', () => {
  const trabajo = { ...CATEGORIA_GENERAL, id: 'cat-trabajo', nombre: 'Trabajo' };

  it('CB-24: rechaza un nombre que ya existe sin importar mayúsculas', () => {
    expect(validarCategoria({ nombre: 'trabajo', color: 'azul' }, [trabajo], null)).toEqual({
      ok: false,
      errores: { nombre: 'Ya existe una categoría con ese nombre' },
    });
  });

  it('al editar, una categoría puede conservar su propio nombre', () => {
    expect(validarCategoria({ nombre: 'Trabajo', color: 'verde' }, [trabajo], trabajo.id).ok).toBe(true);
  });

  it('rechaza colores fuera de la paleta y nombres vacíos', () => {
    expect(validarCategoria({ nombre: ' ', color: 'naranja' }, [], null)).toEqual({
      ok: false,
      errores: { nombre: 'El nombre es obligatorio', color: 'Elija un color' },
    });
  });
});
