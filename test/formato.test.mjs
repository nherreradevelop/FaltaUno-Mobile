import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, it } from 'node:test';
import { URL } from 'node:url';

const modulo = new URL('../src/comun/formato.ts', import.meta.url).href;
const casos = [
  { iso: '2026-12-01T00:22:00Z', dia: 'lunes 30 de noviembre', hora: '21:22', corta: 'lun 30 nov · 21:22', fecha: '30 nov 2026' },
  {
    iso: '2027-01-01T00:30:00Z',
    dia: 'jueves 31 de diciembre',
    hora: '21:30',
    corta: 'jue 31 dic · 21:30',
    fecha: '31 dic 2026',
  },
  { iso: '2026-12-01T03:00:00Z', dia: 'martes 1 de diciembre', hora: '00:00', corta: 'mar 1 dic · 00:00', fecha: '1 dic 2026' },
];

describe('CU09 y CU10 H04 fechas en Uruguay', () => {
  for (const zona of ['UTC', 'America/Montevideo', 'America/Los_Angeles', 'Asia/Tokyo']) {
    it(`mantiene listado, detalle y plazo en Uruguay con el dispositivo en ${zona}`, () => {
      const codigo = `
        import { registerHooks } from 'node:module';
        registerHooks({
          resolve(specifier, contexto, siguiente) {
            try { return siguiente(specifier, contexto); }
            catch (error) {
              if (specifier.startsWith('.') && error.code === 'ERR_MODULE_NOT_FOUND') return siguiente(specifier + '.ts', contexto);
              throw error;
            }
          },
        });
        const formato = await import(${JSON.stringify(modulo)});
        const casos = ${JSON.stringify(casos)};
        console.log(JSON.stringify(casos.map(({ iso }) => ({
          dia: formato.formatearDia(iso),
          hora: formato.formatearHora(iso),
          corta: formato.formatearFechaHoraCorta(iso),
          fecha: formato.formatearFecha(iso).replaceAll('.', ''),
          completa: formato.formatearFechaHora(iso),
        }))));
      `;
      const resultado = spawnSync(process.execPath, ['--experimental-transform-types', '--input-type=module', '-e', codigo], {
        env: { ...process.env, TZ: zona },
        encoding: 'utf8',
      });
      assert.equal(resultado.status, 0, resultado.stderr);
      assert.deepEqual(
        JSON.parse(resultado.stdout),
        casos.map(({ dia, hora, corta, fecha }) => ({ dia, hora, corta, fecha, completa: `${dia} · ${hora}` })),
      );
    });
  }
});
