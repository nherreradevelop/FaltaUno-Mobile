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
```

## Crear el proyecto de Expo (una sola vez)

El proyecto va en la raíz del repositorio. Como la raíz ya tiene la configuración, la plantilla se crea en una carpeta aparte y se trae:

1. Fuera del repositorio: `npx create-expo-app@latest faltauno-mobile-tmp`
2. Copiar a la raíz del repositorio todo lo de la plantilla **menos** `node_modules/`, `.git/`, `README.md`, `tsconfig.json`, `.gitignore` y su `eslint.config.js`.
3. En el `package.json` del repositorio, agregar `main`, los scripts (`start`, `android`, `ios`, `web`) y las `dependencies` de la plantilla, y de sus `devDependencies` las que no sean de ESLint (`eslint-config-expo` no va).
4. `npm install`, `npx expo start` y borrar la carpeta temporal.

En desarrollo, la dirección de la API se arma con la IP de la computadora que da Expo (`Constants.expoConfig.hostUri`) y el puerto 3000.

## Calidad de código

- **Prettier** da el formato (`.prettierrc`) y **ESLint** revisa el código (`eslint.config.mjs`).
- **Husky** ejecuta ambos sobre los archivos de cada commit (`lint-staged`). Si ESLint encuentra un error, el commit se cancela.
- `tsconfig.json` combina la base de Expo con `tsconfig.base.json` (modo estricto). Hasta crear el proyecto, VS Code puede marcar que no encuentra `expo/tsconfig.base`.

```bash
npm run lint           # revisar todo el repositorio
npm run lint:fix       # corregir lo que se pueda automáticamente
npm run format         # formatear todo
npm run format:check   # verificar el formato sin modificar
```

## Integración continua

GitHub Actions (`.github/workflows/ci.yml`) se ejecuta en cada pull request y push a `develop` o `main`: lint y formato siempre; verificación de tipos en cuanto exista `app.json`, y pruebas en cuanto exista el script `test`.

## Forma de trabajo

La misma en los tres repositorios: ramas `develop` y `main`, cada tarea en una rama `feature/...` o `fix/...` que entra a `develop` por pull request revisado por otro integrante y con el CI en verde, y cada entrega etiquetada con su versión (`v0.1.0`, ...).
