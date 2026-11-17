# Regresión de detalle teclado y fechas

## Cambios

- CU09: se valida el contrato del detalle antes de mostrarlo. Una respuesta 200 con {} o datos incompletos produce el error recuperable y permite reintentar. La ruta tiene además un límite de errores de render.
- CU08 y CU10: el panel de filtros y la creación ajustan el área disponible al teclado. Descripción se desplaza considerando el margen seguro para permanecer visible.
- Las fechas del listado, detalle, plazos e historial usan America/Montevideo, independientemente de la zona del dispositivo.
- El tratamiento del enlace faltauno://actividades/<id> después del login no se modifica, según la indicación del equipo.

## Validación

Ejecución local de referencia del 14/11/2026: 61 pruebas móviles aprobadas, sin omisiones; TypeScript, ESLint y formato aprobados. Las fechas se probaron en cuatro zonas, con cambio de mes, año y medianoche. La API de CU37 aprobó 203 pruebas con PostgreSQL y Redis locales.

En Android API 37 se verificó el error controlado ante HTTP 200 con {}, su recuperación al reintentar y la fecha del detalle. El teclado se verificó con Máximo de personas y Descripción. No se ejecutó iOS. La marca de cierre persistente de la corrección H03 corresponde al cliente web; no se afirma su implementación en SecureStore.

Ejecutar npm test, npm run lint, npm run format:check y npm run typecheck.
