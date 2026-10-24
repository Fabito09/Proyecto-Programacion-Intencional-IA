import { describe, expect, it } from 'vitest';
import { CLAVE_ALMACENAMIENTO } from '../../src/domain/modelo';
import { Aplicacion } from '../../src/services/aplicacion';
import { AlmacenEnMemoria } from '../almacenEnMemoria';
import { AHORA, unBorrador } from '../fabricas';

const HORARIO = { dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'], entrada: '08:00', salida: '17:00' };

function crearAplicacion(almacen = new AlmacenEnMemoria(), ahora = AHORA): Aplicacion {
  let siguienteId = 0;
  const aplicacion = new Aplicacion({ almacen, reloj: () => ahora, generarId: () => `id-${++siguienteId}` });
  aplicacion.cargar();
  return aplicacion;
}

/** Recorre el primer uso completo y deja la app en el calendario. */
function aplicacionLista(almacen = new AlmacenEnMemoria(), ahora = AHORA): Aplicacion {
  const aplicacion = crearAplicacion(almacen, ahora);
  aplicacion.confirmarBienvenida('Ana', HORARIO);
  aplicacion.terminarPasoDeTareas();
  aplicacion.guardarRecordatorios({ principal: '', secundario: '' });
  return aplicacion;
}

function idGeneral(aplicacion: Aplicacion): string {
  return aplicacion.obtenerEstado().categorias[0]?.id ?? '';
}

describe('primer uso (RF-INI)', () => {
  it('RF-INI-01: sin datos guardados empieza en la bienvenida', () => {
    expect(crearAplicacion().pantalla()).toBe('bienvenida');
  });

  it('CB-32: una bienvenida inválida no guarda nada (RF-INI-02)', () => {
    const almacen = new AlmacenEnMemoria();
    const respuesta = crearAplicacion(almacen).confirmarBienvenida('  ', HORARIO);
    expect(respuesta).toEqual({ tipo: 'invalido', errores: { nombre: 'El nombre es obligatorio' } });
    expect(almacen.datos.size).toBe(0);
  });

  it('RF-INI-04 y RF-CAT-01: una bienvenida válida guarda el estado inicial con la categoría General', () => {
    const aplicacion = crearAplicacion();
    aplicacion.confirmarBienvenida('Ana', HORARIO);
    expect(aplicacion.pantalla()).toBe('agregar_tareas');
    expect(aplicacion.obtenerEstado().categorias).toMatchObject([{ nombre: 'General', color: 'gris' }]);
  });

  it('CB-35: tras F5 en "Agregue sus tareas" vuelve al mismo paso con sus tareas (RF-PER-02)', () => {
    const almacen = new AlmacenEnMemoria();
    const antes = crearAplicacion(almacen);
    antes.confirmarBienvenida('Ana', HORARIO);
    antes.guardarTarea(unBorrador({ categoriaId: idGeneral(antes) }), null);

    const despues = crearAplicacion(almacen);
    expect(despues.pantalla()).toBe('agregar_tareas');
    expect(despues.obtenerEstado().tareas).toHaveLength(1);
  });

  it('RF-INI-06 y RF-INI-07: tareas → recordatorios → calendario', () => {
    const aplicacion = crearAplicacion();
    aplicacion.confirmarBienvenida('Ana', HORARIO);
    aplicacion.terminarPasoDeTareas();
    expect(aplicacion.pantalla()).toBe('recordatorios');
    aplicacion.guardarRecordatorios({ principal: '08:00', secundario: '' });
    expect(aplicacion.pantalla()).toBe('calendario');
    expect(aplicacion.obtenerEstado().preferencias.recordatorios.secundario.hora).toBeNull();
  });
});

describe('tareas y persistencia', () => {
  it('RN-07: guardar una tarea que choca de horario avisa sin bloquear', () => {
    const aplicacion = aplicacionLista();
    const categoriaId = idGeneral(aplicacion);
    aplicacion.guardarTarea(unBorrador({ titulo: 'Informe', horaInicio: '09:30', metaHoras: '1', metaMinutos: '30', categoriaId }), null);
    const respuesta = aplicacion.guardarTarea(
      unBorrador({ titulo: 'Llamada', horaInicio: '09:00', metaHoras: '1', metaMinutos: '0', categoriaId }),
      null,
    );
    expect(respuesta).toEqual({
      tipo: 'ok',
      avisos: ['Tarea guardada', "Esta tarea comparte horario con 'Informe' (09:30–11:00)"],
    });
    expect(aplicacion.obtenerEstado().tareas).toHaveLength(2);
  });

  it('CB-40: si LocalStorage está lleno, la tarea no se agrega y lo anterior sigue intacto (RF-PER-04)', () => {
    const almacen = new AlmacenEnMemoria();
    const aplicacion = aplicacionLista(almacen);
    const guardadoAntes = almacen.datos.get(CLAVE_ALMACENAMIENTO);
    almacen.fallarAlGuardar = true;

    const respuesta = aplicacion.guardarTarea(unBorrador({ categoriaId: idGeneral(aplicacion) }), null);
    expect(respuesta).toEqual({ tipo: 'sin_guardar', mensaje: 'No se pudo guardar. Sus datos anteriores siguen intactos.' });
    expect(aplicacion.obtenerEstado().tareas).toHaveLength(0);
    expect(almacen.datos.get(CLAVE_ALMACENAMIENTO)).toBe(guardadoAntes);
  });

  it('CB-39: con datos corruptos muestra el error y "Restablecer datos" vuelve a la bienvenida (RF-PER-03)', () => {
    const almacen = new AlmacenEnMemoria();
    almacen.datos.set(CLAVE_ALMACENAMIENTO, 'no es json');
    const aplicacion = crearAplicacion(almacen);
    expect(aplicacion.pantalla()).toBe('datos_ilegibles');
    expect(almacen.datos.get(CLAVE_ALMACENAMIENTO)).toBe('no es json');

    aplicacion.restablecerDatos();
    expect(aplicacion.pantalla()).toBe('bienvenida');
    expect(almacen.datos.size).toBe(0);
  });

  it('RN-10: iniciar un segundo cronómetro avisa que se pausó el primero', () => {
    const aplicacion = aplicacionLista();
    const categoriaId = idGeneral(aplicacion);
    aplicacion.guardarTarea(unBorrador({ titulo: 'A', categoriaId }), null);
    aplicacion.guardarTarea(unBorrador({ titulo: 'B', horaInicio: '11:00', categoriaId }), null);
    const [a, b] = aplicacion.obtenerEstado().tareas;
    aplicacion.iniciarCronometro(a?.id ?? '');
    expect(aplicacion.iniciarCronometro(b?.id ?? '')).toEqual({ tipo: 'ok', avisos: ["Se pausó el cronómetro de 'A'"] });
  });

  it('avisa a la interfaz después de cada cambio guardado', () => {
    const aplicacion = aplicacionLista();
    let avisosRecibidos = 0;
    aplicacion.suscribir(() => (avisosRecibidos += 1));
    aplicacion.cambiarVista('semana');
    expect(avisosRecibidos).toBe(1);
  });
});

describe('categorías (RF-CAT, RN-04)', () => {
  it('CB-25: no se puede eliminar la única categoría (RF-CAT-03)', () => {
    const aplicacion = aplicacionLista();
    expect(aplicacion.eliminarCategoria(idGeneral(aplicacion), null)).toEqual({
      tipo: 'invalido',
      errores: { categoria: 'Debe existir al menos una categoría' },
    });
  });

  it('CB-26: eliminar una categoría con tareas exige destino y las mueve (RN-04)', () => {
    const aplicacion = aplicacionLista();
    const general = idGeneral(aplicacion);
    aplicacion.guardarCategoria({ nombre: 'Clientes', color: 'verde' }, null);
    const clientes = aplicacion.obtenerEstado().categorias[1]?.id ?? '';
    aplicacion.guardarTarea(unBorrador({ categoriaId: clientes }), null);

    expect(aplicacion.eliminarCategoria(clientes, null)).toEqual({
      tipo: 'invalido',
      errores: { destino: 'Elija una categoría' },
    });
    aplicacion.eliminarCategoria(clientes, general);
    expect(aplicacion.obtenerEstado().categorias).toHaveLength(1);
    expect(aplicacion.obtenerEstado().tareas[0]?.categoriaId).toBe(general);
  });
});

describe('evaluación periódica (RF-REC-01)', () => {
  it('RN-02: avisa una sola vez por día y lo recuerda tras recargar', () => {
    const almacen = new AlmacenEnMemoria();
    const lunes = new Date(2026, 9, 26, 7, 50);
    const aplicacion = aplicacionLista(almacen, lunes);
    aplicacion.guardarTarea(unBorrador({ categoriaId: idGeneral(aplicacion) }), null);
    aplicacion.guardarRecordatorios({ principal: '08:00', secundario: '' });

    const alas8 = crearAplicacion(almacen, new Date(2026, 9, 26, 8, 0));
    expect(alas8.evaluar().resumen).toEqual({ deHoy: 1, deAltaPrioridad: 0, vencidas: 0 });
    expect(crearAplicacion(almacen, new Date(2026, 9, 26, 8, 1)).evaluar().resumen).toBeNull();
  });

  it('CB-34: cambiar el horario conserva las tareas que quedan afuera y avisa (RF-AJU-03)', () => {
    const aplicacion = aplicacionLista();
    aplicacion.guardarTarea(unBorrador({ horaInicio: '16:00', metaHoras: '0', metaMinutos: '30', categoriaId: idGeneral(aplicacion) }), null);
    const respuesta = aplicacion.guardarHorario({ ...HORARIO, salida: '15:00' });
    expect(respuesta).toEqual({ tipo: 'ok', avisos: ['1 tareas quedan fuera de su nuevo horario. Ajústelas cuando las edite.'] });
    expect(aplicacion.obtenerEstado().tareas).toHaveLength(1);
  });
});
