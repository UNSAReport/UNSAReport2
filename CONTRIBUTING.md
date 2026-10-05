# Guía de contribución para UNSAReport

¡Gracias por tu interés en contribuir a UNSAReport! Ya sea que desees reportar un error o programar en el CLI y los microservicios, tus contribuciones son bienvenidas.

Esta guía se divide en dos partes principales:
1. [Reportar problemas y sugerir funcionalidades](#-parte-1-reportar-problemas-y-sugerir-funcionalidades) (sin requerir código)
2. [Entorno de desarrollo y Pull Requests](#-parte-2-entorno-de-desarrollo-y-pull-requests) (para desarrolladores y colaboradores de código)

---

## Parte 1: Reportar problemas y sugerir funcionalidades

Si encuentras un comportamiento inesperado o tienes dudas, por favor abre una issue en GitHub.

### 1. Revisar issues existentes
Antes de crear una nueva issue, consulta el [rastreador de issues en GitHub](https://github.com/UNSAReport/UNSAReport2/issues) para verificar si el problema o idea ya ha sido reportado previamente.

### 2. Reportar un error
Si encontraste un bug:
- Abre un [Reporte de error](https://github.com/UNSAReport/UNSAReport2/issues/new?template=bug_report.yml).
- Incluye los pasos exactos para reproducirlo.
- Indica tu sistema operativo y las versiones de `unsarep` y `typst` (ejecuta `unsarep version` y `typst --version`).
- Adjunta el registro de terminal completo o las trazas del error.

### 3. Solicitar una funcionalidad 
Si requieres una nueva característica o mejoras en el flujo de trabajo del CLI:
- Abre una [Solicitud de funcionalidad](https://github.com/UNSAReport/UNSAReport2/issues/new?template=feature_request.yml).
- Explica la motivación académica o técnica (p. ej. previsualización de diapositivas, integración con un sistema de autenticación, etc.).
- Describe el flujo de trabajo o sintaxis que propones.

---

## Parte 2: Entorno de desarrollo y pull requests

Esta sección describe la arquitectura del monorepo, los requisitos previos locales, cómo levantar la infraestructura de microservicios y el proceso para enviar un pull request.

### Arquitectura del monorepo

El repositorio organiza sus servicios y librerías compartidas en los siguientes directorios:

| Directorio | Servicio / Componente | Tecnologías | Descripción |
|------------|-----------------------|-------------|-------------|
| [`tui/`](tui) | CLI `unsarep` | Go 1.24+ (Cobra, Huh) | Herramienta de línea de comandos para creación de informes, diapositivas, autenticación y paquetes |
| [`web/`](web) | Frontend Web | TanStack Start, Vite, Bun | Aplicación web full-stack alojada en `unsareport.ynoacamino.tech` |
| [`registry/`](registry) | Registro de Paquetes | Bun, Hono, Postgres, SeaweedFS | API del registro para publicar, resolver y descargar paquetes Typst |
| [`auth/`](auth) | Proveedor de Identidad (IdP) | Bun, Hono, Postgres | Servicio de autenticación OAuth2 / OIDC y administración de tokens PAT |
| [`slides/`](slides) | Servicio de Diapositivas | Bun, Hono, Postgres | Backend para creación y despliegue de presentaciones interactivas |
| [`packages/`](packages) | Librerías compartidas | TypeScript, Bun | Paquetes compartidos del monorepo (`@unsa/slides-kit`, `@unsa/logger`) |

### Requisitos del entorno de desarrollo

- [Bun](https://bun.sh/) (1.2 o superior, recomendado 1.3+) - Gestor de paquetes y runtime para TypeScript/JavaScript.
- [Go](https://go.dev/) (1.24 o superior) - Para desarrollar y compilar `unsarep`.
- [Docker](https://docs.docker.com/) y Docker Compose - Para bases de datos PostgreSQL locales, almacenamiento S3 SeaweedFS y Traefik.
- *(No se requiere instalar `just` ni `moon` globalmente)*: Las tareas del monorepo se ejecutan mediante `bun run <comando>`, utilizando `@moonrepo/cli` instalado como dependencia del espacio de trabajo.
- *(Opcional)* [Nix](https://nixos.org/) - Proporciona un entorno reproducible sin instalación manual:
  ```bash
  nix develop
  ```

> [!TIP]
> Para una referencia exhaustiva de comandos, puertos y resolución de problemas, consulta la [Guía de Desarrollo del Monorepo](docs/development-guide.md).

### Guía paso a paso

#### 1. Instalar dependencias y materializar variables de entorno
Instala los paquetes del monorepo y ejecuta `bun run decrypt` para generar los archivos `.env.<ENV>` (por defecto `dev`) en la raíz y en cada subservicio (`auth/`, `registry/`, `slides/`, `web/`, `tui/`):

```bash
bun install
bun run decrypt
```

- **Valores base**: Se materializan automáticamente desde `.env.example` y `<servicio>/.env.example`.
- **SOPS (automático)**: Los secretos cifrados son para uso del equipo de desarrollo oficial. Si no tienes acceso a las llaves, se omitirán limpiamente y se usarán las configuraciones de desarrollo por defecto.
- **Sobrescrituras locales**: Crea `.env.dev.override` (raíz) o `<servicio>/.env.dev.override` para ajustes personales.

#### 2. Iniciar infraestructura local y ejecutar migraciones
Inicia las bases de datos PostgreSQL, el servicio S3 SeaweedFS y el gateway inverso Traefik: 

```bash
bun run infra:up
```

Aplica las migraciones de base de datos en todos los servicios que las requieren (`auth`, `registry`, `slides`):

```bash
bun run db:migrate
```

#### 3. Iniciar servidores de desarrollo
Inicia todos los servicios de la aplicación de manera nativa con recarga en vivo:

```bash
bun run dev
```

También puedes iniciar servicios de manera aislada según tu tarea actual:
- `bun run dev:web`: Inicia la aplicación web
- `bun run dev:slides`: Inicia el microservicio de diapositivas
- `bun run dev:registry`: Inicia el registro de paquetes Typst
- `bun run dev:auth`: Inicia el proveedor de identidad
- `bun run dev:tui`: Ejecuta el CLI `unsarep` con `go run`

- Entrada principal del Gateway (Traefik): `http://localhost:9876` (rutas `/api/auth` → `:3000`, `/api/registry` → `:3001`, `/api/slides` → `:3002`, `/` → web `:3100`)
- Aplicación Web: `http://localhost:3100` (o enrutada mediante Traefik)

#### 4. Gateway Traefik y red en desarrollo

Traefik opera en `network_mode: host` en `compose.dev.yml`, por lo que se enlaza directamente a la interfaz del host en el puerto `:9876` y reenvía el tráfico a los servicios locales a través de `127.0.0.1`:

| Puerto Host | Servicio | Enrutamiento en Gateway |
|-------------|----------|-------------------------|
| `3000` | IdP de Autenticación (`auth/`) | `http://localhost:9876/api/auth` |
| `3001` | Registro de Paquetes (`registry/`) | `http://localhost:9876/api/registry` |
| `3002` | Servicio de Diapositivas (`slides/`) | `http://localhost:9876/api/slides` |
| `3100` | Aplicación Web (`web/app`) | `http://localhost:9876/` |

#### 5. Desarrollo del módulo de diapositivas (Slides)

El ecosistema de diapositivas de UNSAReport está compuesto por:
- **`packages/slides-kit`**: Kit oficial de layouts, temas visuales, primitivas y renderizador basado en Reveal.js.
  - **Convención de Layouts**: Los 110 layouts deben ser **estrictamente estructurales**. No se deben incluir clases ni estilos de colores hardcodeados (como `bg-slate-900`, `text-white`), ya que la paleta cromática es controlada exclusivamente por los temas a través del `ThemeProvider` y variables CSS (`var(--slide-bg)`, `var(--slide-text)`, etc.).
  - **Sin Barrel Files**: Por diseño y rendimiento del bundler, **no** se permiten archivos `index.ts` que re-exporten componentes en masa. Cada familia y módulo se importa o registra explícitamente (`./src/layouts/registry.ts`, `./src/themes/registry.ts`, etc.).
  - **Importaciones Absolutas**: Todas las importaciones internas deben emplear el alias de ruta `@/*` (ej. `@/layouts/types`). Las importaciones relativas (`./` o `../`) están expresamente prohibidas por las reglas de Biome.
- **`slides/`**: Microservicio backend para autorización, almacenamiento y servicio de presentaciones.
  - Gestiona metadatos con Drizzle ORM sobre PostgreSQL.
  - Almacena bundles comprimidos y archivos estáticos en SeaweedFS (S3).
  - Sirve diapositivas en `/api/slides/embed/:id/v:version/*` (interno `/embed/:id/v:version/*`) con verificación de políticas de visibilidad (`public`, `unlisted`, `private`, `org`).
- **`tui/`**: CLI oficial `unsarep` con subcomandos `slides`:
  - `unsarep slides init <nombre>`: Inicializa un proyecto configurado con Vite y `@unsa/slides-kit` (el tema se elige con la clave `theme` en `deck.config.ts`; no existe flag `--theme`).
  - `unsarep slides dev` (default `--port 4000`): Servidor de previsualización local con HMR.
  - `unsarep slides layouts` (110 en 9 familias) y `unsarep slides themes` (5 oficiales): Exploración y catálogo de componentes en terminal.
  - `unsarep slides import deck.pptx`: Extrae colores/fuentes OOXML a un patch `themes/<slug>.ts` (fidelidad: solo colores/fuentes).
  - `unsarep slides link --title/--slug/--org/--visibility` y `unsarep slides deploy --token/--yes`: Empaquetado zip (límite 50 MiB) y subida multipart a S3.
  - `unsarep slides login` y `unsarep slides whoami --token/--json`: Auth IdP + estado del servicio.
- **`web/`**: Plataforma web:
  - `/presentations`: Dashboard con filtrado por visibilidad y organización.
  - `/presentations/$slug`: Visor institucional con iframe sandboxed y notas de orador (`?present=1` modo presentación, botón PDF `?print-pdf`).
  - `/presentations/catalog`: Showcase interactivo de los 110 layouts y 5 temas.

Para consultar los diagramas de arquitectura detallados, estructura de archivos y flujos de registro, revisa la [Guía de Arquitectura de Slides](docs/slides.md) y la documentación de [`@unsa/slides-kit`](packages/slides-kit/README.md).

---

## Pruebas y calidad de código

Antes de enviar un pull request, verifica que todos los linters, validadores de tipos y pruebas unitarias se ejecuten con éxito.

### Verificación de estilo y tipos

Ejecuta la comprobación integral del espacio de trabajo:

```bash
bun run check
```

Esta tarea ejecuta:
- `biome` en el código TypeScript/JavaScript (`web`, `auth`, `registry`, `slides`, `packages`).
- `golangci-lint` (si está disponible) y `go vet` en el CLI en Go (`tui/`).
- El compilador de TypeScript (`tsc --noEmit`) en todos los proyectos TS.

### Ejecución de pruebas

Ejecuta las suites de pruebas unitarias:

```bash
bun run test
```

Para probar servicios individuales:
```bash
bun run test:slides    # Pruebas del microservicio de diapositivas
bun run test:kit       # Pruebas unitarias de layouts y temas de slides-kit
bun run test:registry  # Pruebas de la API del registro de paquetes
bun run test:auth      # Pruebas de autenticación y roles
bun run test:tui       # Pruebas del CLI en Go
```

---

## Envío de un pull request 

1. **Nombre de rama**: Crea una rama descriptiva a partir de `dev`:
   ```bash
   git checkout -b fix/descripcion-del-problema
   # o
   git checkout -b feat/nombre-funcionalidad
   ```
2. **Mensajes de commit**: Emplea el estándar de conventional commits (ej. `feat(tui): agregar flag de debounce para watch`, `fix(registry): corregir error de scope no encontrado`).
3. **Validación local**: Asegúrate de que `bun run check` y `bun run test` finalicen sin errores.
4. **Crea la PR**: Sube tu rama a GitHub y abre la pull request. Completa la plantilla de pull request vinculando las issues resueltas (`Fixes #123`).
5. **Revisión de código**: Responde a los comentarios de revisión. Una vez aprobado y pasadas las pruebas de CI, un mantenedor incorporará los cambios.

---

## Licencia
Al contribuir en UNSAReport, aceptas que tus contribuciones se distribuyan bajo la licencia [AGPL-3.0](LICENSE) del proyecto.
