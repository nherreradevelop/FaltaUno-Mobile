import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { setTimeout as esperar } from 'node:timers/promises';
registerHooks({
  resolve(specifier, contexto, siguiente) {
    try {
      return siguiente(specifier, contexto);
    } catch (error) {
      if (specifier.startsWith('.') && error.code === 'ERR_MODULE_NOT_FOUND') return siguiente(specifier + '.ts', contexto);
      throw error;
    }
  },
});
const { conectarActualizacionesFinancieras, refrescarFinanzasDelUsuario, suscribirActualizacionFinanciera } =
  await import('../src/comun/actualizacionesFinancieras.ts');
function canal() {
  const eventos = new Map();
  return {
    on(nombre, fn) {
      eventos.set(nombre, fn);
    },
    off(nombre, fn) {
      if (eventos.get(nombre) === fn) eventos.delete(nombre);
    },
    emitir(nombre, datos) {
      eventos.get(nombre)?.(datos);
    },
    eventos,
  };
}
describe('CU23–CU26: actualización financiera entre sesiones', () => {
  it('refresca solo la actividad y el usuario correspondientes; agrupa una ráfaga', async () => {
    const socket = canal();
    const cerrar = conectarActualizacionesFinancieras(socket, 'ana');
    let llamadas = 0;
    const salir = suscribirActualizacionFinanciera('ana', 'actividad', async () => {
      llamadas++;
    });
    const otro = suscribirActualizacionFinanciera('bruno', 'actividad', async () => {
      throw new Error('No debe consultar otra sesión');
    });
    try {
      socket.emitir('finanzas:actualizadas', { actividadId: 'otra' });
      socket.emitir('finanzas:actualizadas', { actividadId: 'actividad' });
      socket.emitir('finanzas:actualizadas', { actividadId: 'actividad' });
      await esperar(160);
      assert.equal(llamadas, 1);
    } finally {
      salir();
      otro();
      cerrar();
    }
  });
  it('recupera cambios al conectar o volver a primer plano', async () => {
    const socket = canal();
    const cerrar = conectarActualizacionesFinancieras(socket, 'ana');
    let llamadas = 0;
    const salir = suscribirActualizacionFinanciera('ana', 'actividad', async () => {
      llamadas++;
    });
    try {
      socket.emitir('connect');
      await esperar(160);
      refrescarFinanzasDelUsuario('ana');
      await esperar(160);
      assert.equal(llamadas, 2);
    } finally {
      salir();
      cerrar();
    }
  });
  it('un cambio durante una consulta provoca otra consulta al terminar, sin superponerlas', async () => {
    const socket = canal();
    const cerrar = conectarActualizacionesFinancieras(socket, 'ana');
    let liberar;
    let llamadas = 0;
    const salir = suscribirActualizacionFinanciera('ana', 'actividad', async () => {
      llamadas++;
      if (llamadas === 1)
        await new Promise((resolve) => {
          liberar = resolve;
        });
    });
    try {
      socket.emitir('finanzas:actualizadas', { actividadId: 'actividad' });
      await esperar(160);
      assert.equal(llamadas, 1);
      socket.emitir('finanzas:actualizadas', { actividadId: 'actividad' });
      await esperar(160);
      assert.equal(llamadas, 1);
      liberar();
      await esperar(160);
      assert.equal(llamadas, 2);
    } finally {
      liberar?.();
      salir();
      cerrar();
    }
  });
  it('desmontar cancela consultas pendientes y elimina listeners del socket', async () => {
    const socket = canal();
    const cerrar = conectarActualizacionesFinancieras(socket, 'ana');
    let llamadas = 0;
    const salir = suscribirActualizacionFinanciera('ana', 'actividad', async () => {
      llamadas++;
    });
    socket.emitir('finanzas:actualizadas', { actividadId: 'actividad' });
    await Promise.resolve();
    salir();
    cerrar();
    await esperar(160);
    assert.equal(llamadas, 0);
    assert.equal(socket.eventos.size, 0);
  });
  it('ignora avisos malformados sin perder la suscripción', async () => {
    const socket = canal();
    const cerrar = conectarActualizacionesFinancieras(socket, 'ana');
    let llamadas = 0;
    const salir = suscribirActualizacionFinanciera('ana', 'actividad', async () => {
      llamadas++;
    });
    try {
      for (const dato of [null, {}, 'actividad', { actividadId: 3 }, { actividadId: '' }])
        socket.emitir('finanzas:actualizadas', dato);
      await esperar(160);
      assert.equal(llamadas, 0);
    } finally {
      salir();
      cerrar();
    }
  });
  it('no vuelve a consultar cuando se desmonta durante un GET', async () => {
    const socket = canal();
    const cerrar = conectarActualizacionesFinancieras(socket, 'ana');
    let liberar;
    let llamadas = 0;
    const salir = suscribirActualizacionFinanciera('ana', 'actividad', async () => {
      llamadas++;
      await new Promise((resolve) => {
        liberar = resolve;
      });
    });
    socket.emitir('finanzas:actualizadas', { actividadId: 'actividad' });
    await esperar(160);
    socket.emitir('finanzas:actualizadas', { actividadId: 'actividad' });
    await Promise.resolve();
    salir();
    cerrar();
    liberar();
    await esperar(160);
    assert.equal(llamadas, 1);
  });
});
