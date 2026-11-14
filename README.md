# FaltaUno - Mobile

App móvil de FaltaUno (React Native + Expo + TypeScript), la plataforma para organizar actividades deportivas al aire libre y encontrar compañeros.
Proyecto final de la carrera Analista en Tecnologías de la Información (Universidad ORT Uruguay).

| Repositorio                                                                  | Contenido                                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [FaltaUno](https://github.com/nherreradevelop/FaltaUno)                      | API, esquema de la base, Docker de desarrollo y flujos de n8n |
| [FaltaUno-Web](https://github.com/nherreradevelop/FaltaUno-Web)              | Cliente web                                                   |
| [FaltaUno-Mobile](https://github.com/nherreradevelop/FaltaUno-Mobile) (este) | App móvil                                                     |

## Requisitos

- [Node.js 22](https://nodejs.org) (la versión está fijada en `.nvmrc`)
- La API corriendo en local: seguir el README del repositorio [FaltaUno](https://github.com/nherreradevelop/FaltaUno) (`docker compose up -d` y levantar la API)
- Expo Go en el celular, conectado a la misma red Wi-Fi que la computadora
- VS Code con las extensiones **ESLint** y **Prettier**

## Primera vez

```bash
git clone https://github.com/nherreradevelop/FaltaUno-Mobile.git
cd FaltaUno-Mobile
npm install
cp .env.example .env      # en PowerShell: Copy-Item .env.example .env
```

## Ejecutar

Con la API corriendo en local:

```bash
npx expo start            # Expo Go: todo menos el login con Google
npx expo run:ios          # development build (necesario para el login con Google)
npx expo run:android
npm run typecheck         # verificar tipos
```

Si `EXPO_PUBLIC_URL_API` queda vacía, en desarrollo la dirección de la API se arma con la IP de la computadora que da Expo (`Constants.expoConfig.hostUri`) y el puerto 3000.
Las carpetas `android/` e `ios/` las genera `expo run` y no se suben al repositorio.

## Dashboard y filtros

El dashboard muestra primero las actividades que gestionás, luego las que integrás y finalmente «Actividades que podrían interesarte». Cada sección tiene su propia paginación; las actividades propias siguen visibles aunque estén completas.

Los filtros se aplican solo a las recomendaciones. Al entrar por primera vez en una sesión se seleccionan tus deportes de interés. La selección aplicada se conserva al navegar, recargar o reabrir y se descarta al cerrar sesión, vencer o cambiar de cuenta. Quitar todos los deportes deja la búsqueda sin ese filtro; no restaura automáticamente los intereses. La selección es local a cada dispositivo.

Las tarjetas muestran «Buscando traslado» y/o «Con locomoción» según lo declarado por el organizador. Tener vehículo no garantiza asientos disponibles. El formulario de creación muestra «Traslado» antes de «Recorrido» y usa «Participantes externos» en sus textos.

## Calidad de código

- **Prettier** da el formato (`.prettierrc`) y **ESLint** revisa el código (`eslint.config.mjs`).
- **Husky** ejecuta ambos sobre los archivos de cada commit (`lint-staged`). Si ESLint encuentra un error, el commit se cancela.
- `tsconfig.json` combina la base de Expo con `tsconfig.base.json` (modo estricto).

```bash
npm run lint           # revisar todo el repositorio
npm run lint:fix       # corregir lo que se pueda automáticamente
npm run format         # formatear todo
npm run format:check   # verificar el formato sin modificar
```

## Integración continua

GitHub Actions (`.github/workflows/ci.yml`) se ejecuta en cada pull request y push a `develop` o `main`: lint y formato siempre; verificación de tipos en cuanto exista `app.json` o `app.config.ts`, y pruebas en cuanto exista el script `test`.

## Forma de trabajo

La misma en los tres repositorios: ramas `develop` y `main`, cada tarea en una rama `feature/...` o `fix/...` que entra a `develop` por pull request revisado por otro integrante y con el CI en verde, y cada entrega etiquetada con su versión (`v0.1.0`, ...).
