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
| [`packages/`](packages) | Librerías compartidas | TypeScript, Bun | Paquetes compartidos del monorepo (ej. `@unsa/logger`) |

### Requisitos del entorno de desarrollo

- [Bun](https://bun.sh/) (última versión estable) - Para servicios de backend y frontend en TypeScript. 
- [Go](https://go.dev/) (1.24 o superior) - Para desarrollar y compilar `unsarep`.
- [Docker](https://docs.docker.com/) y Docker Compose - Para bases de datos PostgreSQL locales, almacenamiento S3 SeaweedFS y Traefik.
- [Moon](https://moonrepo.dev/) - Orquestador de tareas y compilación del monorepo.
- [Just](https://github.com/casey/just) - Ejecutor de comandos para tareas de ciclo de vida del proyecto.
- *(Opcional)* [Nix](https://nixos.org/) - Proporciona un entorno reproducible sin instalación manual:
  ```bash
  nix develop
  ```

### Guía paso a paso

#### 1. Desencriptar y materializar variables de entorno
El repositorio utiliza entornos parametrizados. Ejecuta `just decrypt <env>` para generar los archivos `.env.<ENV>` en la raíz y en cada subservicio (`auth/`, `registry/`, `slides/`, `web/`, `tui/`):

```bash
just decrypt dev
```

- **Valores base**: Se materializan automáticamente desde `.env.example` y `<servicio>/.env.example`.
- **SOPS (automático)**: Los secretos cifrados son para uso del equipo de desarrollo oficial. Si no tienes acceso, se generarán valores de ejemplo.
- **Sobrescrituras locales**: Crea `.env.dev.override` (raíz) o `<servicio>/.env.dev.override` para ajustes personales.

#### 2. Iniciar infraestructura local y ejecutar migraciones
Inicia las bases de datos PostgreSQL, el servicio S3 SeaweedFS y el gateway inverso Traefik: 

```bash
just infra-up dev
```

Aplica las migraciones de base de datos en todos los servicios que las requieren (`auth`, `registry`, `slides`):

```bash
just db-migrate dev
```

#### 3. Iniciar servidores de desarrollo
Inicia todos los servicios de la aplicación de manera nativa con recarga en vivo:

```bash
just dev dev
```

- Entrada principal del Gateway (Traefik): `http://localhost:9876`
- Aplicación Web: Enrutada mediante Traefik hacia `web/app`

#### 4. Firewall en Linux y enrutamiento del bridge de Docker 
Traefik opera en modo red bridge de Docker y reenvía tráfico a los servicios locales mediante `host.docker.internal`. En distribuciones Linux con firewalls estrictos (UFW o Firewalld), permite la comunicación desde la subred del contenedor hacia los puertos del host:

| Puerto Host | Servicio | Acceso |
|-------------|----------|--------|
| `3000` | IdP de Autenticación (`auth/`) | Permitir TCP desde subred bridge de Docker |
| `3001` | Registro de Paquetes (`registry/`) | Permitir TCP desde subred bridge de Docker |
| `3100` | Aplicación Web (`web/app`) | Permitir TCP desde subred bridge de Docker |

Obtén la subred de la red Docker y configura las reglas del firewall:

```bash
# Consultar subred del bridge de Docker
SUBNET=$(docker network inspect unsareport-dev --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')

# En UFW:
sudo ufw allow from "$SUBNET" to any port 3000,3001,3100 proto tcp

# En Firewalld:
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3000 protocol=tcp accept"
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3001 protocol=tcp accept"
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3100 protocol=tcp accept"
sudo firewall-cmd --reload
```

---

## Pruebas y calidad de código

Antes de enviar un pull request, verifica que todos los linters, validadores de tipos y pruebas unitarias se ejecuten con éxito.

### Verificación de estilo y tipos

Ejecuta la comprobación integral del espacio de trabajo:

```bash
moon run check
```

Esta tarea ejecuta:
- `biome` en el código TypeScript/JavaScript (`web`, `auth`, `registry`, `slides`, `packages`).
- `golangci-lint` y `go vet` en el CLI en Go (`tui/`).
- El compilador de TypeScript (`tsc --noEmit`) en todos los proyectos TS.

### Ejecución de pruebas

Ejecuta las suites de pruebas unitarias:

```bash
moon run test
```

Para probar servicios individuales:
```bash
moon run tui:test
moon run registry:test
moon run slides:test
moon run auth:test 
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
3. **Validación local**: Asegúrate de que `moon run check` y `moon run test` finalicen sin errores.
4. **Crea la PR**: Sube tu rama a GitHub y abre la pull request. Completa la plantilla de pull request vinculando las issues resueltas (`Fixes #123`).
5. **Revisión de código**: Responde a los comentarios de revisión. Una vez aprobado y pasadas las pruebas de CI, un mantenedor incorporará los cambios.

---

## Licencia
Al contribuir en UNSAReport, aceptas que tus contribuciones se distribuyan bajo la licencia [AGPL-3.0](LICENSE) del proyecto.
