# Guía de Desarrollo del Monorepo UNSAReport

Esta guía proporciona instrucciones completas y estandarizadas para configurar, desarrollar, probar y compilar cualquier componente de **UNSAReport2** en cualquier entorno (Linux, macOS, Windows/WSL2 o Nix).

---

## 1. Requisitos Previos del Sistema

A diferencia de versiones anteriores, **no requieres instalar `just` ni instalar `moon` de forma global**. Todas las herramientas de orquestación están empaquetadas en las dependencias del monorepo (`devDependencies` con `@moonrepo/cli`).

Solo necesitas tener instalado en tu máquina host:

| Herramienta | Versión Mínima | Uso Principal |
|-------------|----------------|---------------|
| **[Bun](https://bun.sh/)** | `1.2+` (recomendado `1.3+`) | Runtime y gestor de paquetes para servicios TypeScript, frontend y scripts |
| **[Go](https://go.dev/)** | `1.24+` | Compilador para el CLI/TUI `unsarep` |
| **[Docker](https://docs.docker.com/)** + Compose | `v2+` | Bases de datos PostgreSQL, almacenamiento de objetos S3 SeaweedFS y Gateway Traefik |
| *(Opcional)* **[Typst](https://typst.app/)** | `0.13+` | Requerido para probar compilación de informes PDF localmente con `unsarep docs` |
| *(Opcional)* **[Nix](https://nixos.org/)** | Con flakes | Si usas Nix/NixOS, ejecuta `nix develop` para obtener todo el entorno listo |

---

## 2. Inicio Rápido (3 Pasos)

### Paso 1: Instalar dependencias del monorepo

```bash
bun install
```

### Paso 2: Materializar variables de entorno, levantar infraestructura y migrar base de datos

```bash
# 1. Genera los archivos .env.dev a partir de las plantillas y overrides
bun run decrypt

# 2. Levanta los contenedores Docker (PostgreSQL, SeaweedFS S3 y Traefik)
bun run infra:up

# 3. Aplica las migraciones de esquema en PostgreSQL (auth, registry, slides)
bun run db:migrate
```

### Paso 3: Iniciar servidores de desarrollo

```bash
# Iniciar todos los microservicios y la web simultáneamente
bun run dev
```

Los servicios estarán accesibles en:
- **Gateway Traefik**: `http://localhost:9876` (rutas: `/api/auth` → auth `:3000`, `/api/registry` → registry `:3001`, `/api/slides` → slides `:3002`, `/` → web `:3100`)
- **Frontend Web**: `http://localhost:3100` (o a través del gateway)
- **Servicio Auth (IdP)**: `http://localhost:3000` (interno; público vía `/api/auth`)
- **Servicio Registry**: `http://localhost:3001` (interno; público vía `/api/registry`)
- **Servicio Slides**: `http://localhost:3002` (interno; público vía `/api/slides`)
- **SeaweedFS S3 Console / Filer**: `http://localhost:8333` / `http://localhost:8888`

---

## 3. Matriz de Comandos del Monorepo

Todos los comandos se ejecutan a través de `bun run <script>`, el cual delega en la tarea de Moon correspondiente sin requerir instalación global:

### Desarrollo y Servidores Locales

| Comando | Descripción |
|---------|-------------|
| `bun run dev` | Inicia todos los servicios (`auth`, `registry`, `slides`, `website`) con recarga en vivo |
| `bun run dev:web` | Inicia únicamente la aplicación web (`web/app`) |
| `bun run dev:slides` | Inicia únicamente el microservicio de diapositivas (`slides/`) |
| `bun run dev:registry` | Inicia únicamente el registro de paquetes (`registry/`) |
| `bun run dev:auth` | Inicia únicamente el proveedor de identidad (`auth/`) |
| `bun run dev:tui` | Ejecuta el CLI `unsarep` directamente con `go run` |

### Infraestructura y Entorno

| Comando | Descripción |
|---------|-------------|
| `bun run decrypt` | Materializa los archivos `.env.<ENV>` (por defecto `dev`) usando `scripts/materialize-env.sh` |
| `bun run infra:up` | Crea la red Docker e inicia los contenedores de base de datos, S3 y Traefik en segundo plano |
| `bun run infra:down` | Detiene los contenedores Docker de la infraestructura |
| `bun run db:migrate` | Ejecuta las migraciones de Drizzle ORM en `auth`, `registry` y `slides` |

> **Nota sobre entornos (`ENV`)**:
> Puedes definir variables para otros entornos anteponiendo `ENV`:
> ```bash
> ENV=staging bun run decrypt
> ENV=staging bun run infra:up
> ```

### Validación, Calidad y Tipos

| Comando | Descripción |
|---------|-------------|
| `bun run check` | Ejecuta linters (`biome`, `golangci-lint`, `go vet`) y verificación de tipos TypeScript en todo el monorepo |
| `bun run lint` | Ejecuta únicamente los linters en código TS y Go |
| `bun run typecheck` | Ejecuta `tsc --noEmit` en todos los proyectos y paquetes TypeScript |

### Pruebas Unitarias e Integración

| Comando | Descripción |
|---------|-------------|
| `bun run test` | Ejecuta todas las suites de prueba (`registry`, `slides`, `slides-kit`, `tui`) |
| `bun run test:slides` | Ejecuta pruebas del microservicio de presentaciones (`slides/`) |
| `bun run test:kit` | Ejecuta pruebas de layouts, temas y configuración de `@unsa/slides-kit` |
| `bun run test:registry` | Ejecuta pruebas del registro de paquetes (`registry/`) |
| `bun run test:auth` | Ejecuta pruebas del servicio de autenticación (`auth/`) |
| `bun run test:tui` | Ejecuta pruebas de todos los módulos del CLI en Go (`tui/`) |

### Compilación y Producción

| Comando | Descripción |
|---------|-------------|
| `bun run build` | Compila todos los proyectos (`auth`, `registry`, `slides`, `website`, `slides-kit`, `tui`) |
| `bun run build:slides-kit` | Genera los bundles distribuidos y definiciones `.d.ts` de `@unsa/slides-kit` |
| `bun run build:tui` | Compila el binario `dist/unsarep` para la plataforma actual |
| `bun run build:tui:all` | Compila binarios multiplataforma (Linux, macOS, Windows en amd64/arm64) y genera `checksums.txt` |

---

## 4. Flujo de Trabajo Aislado por Microservicio

No es necesario ejecutar todo el monorepo si solo estás trabajando en un componente específico:

### Si trabajas en el CLI `unsarep` (`tui/`):
```bash
# Compilar y probar localmente:
bun run test:tui
bun run build:tui

# Ejecutar el binario generado:
./tui/dist/unsarep --help
```

### Si trabajas en `@unsa/slides-kit` (`packages/slides-kit/`):
```bash
# Ejecutar pruebas unitarias:
bun run test:kit

# Recompilar la librería y tipos .d.ts:
bun run build:slides-kit
```

### Si trabajas en el Microservicio de Diapositivas (`slides/`):
```bash
# Asegurar infraestructura activa:
bun run infra:up
bun run db:migrate

# Iniciar únicamente el servicio slides:
bun run dev:slides

# Ejecutar sus pruebas:
bun run test:slides
```

### Si trabajas en la Aplicación Web (`web/app/`):
```bash
bun run dev:web
```

---

## 5. Gestión de Variables de Entorno y Secretos

El monorepo utiliza un sistema determinista de resolución de variables en cascada implementado en `scripts/materialize-env.sh`:

1. **Plantilla base**: `.env.example` en la raíz y en cada directorio de servicio (`auth/.env.example`, etc.).
2. **Bóveda SOPS (opcional)**: Si tienes llaves de descifrado SOPS configuradas para el equipo central, se descifran automáticamente los valores de `secrets/*.enc.env`. Si no se detectan llaves, este paso se omite limpiamente y se usan los valores de ejemplo.
3. **Sobrescrituras locales (no versionadas)**:
   - Para sobrescribir variables globalmente en tu máquina: crea `.env.dev.override` en la raíz del repositorio.
   - Para sobrescribir variables de un servicio específico: crea `<servicio>/.env.dev.override` (ejemplo: `slides/.env.dev.override`).

---

## 6. Solución de Problemas Comunes

### Error: `docker network create unsareport-dev` o puertos ocupados
- Si los puertos `5432` (PostgreSQL), `8333`/`8888` (SeaweedFS) o `9876` (Traefik) están en conflicto con otros servicios locales, detén los contenedores existentes o personaliza los mapeos en `compose.dev.yml`.

### Firewall en Linux (UFW / Firewalld) bloqueando Traefik
Traefik en contenedor Docker se comunica con los microservicios host a través de `host.docker.internal`. En distribuciones con firewall activo, permite el tráfico desde la subred bridge de Docker hacia los puertos de servicio (el gateway público es `:9876` con rutas `/api/auth`, `/api/registry`, `/api/slides` y `/` → web):

```bash
# Obtener subred de unsareport-dev:
SUBNET=$(docker network inspect unsareport-dev --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')

# En UFW (servicios host detrás del gateway):
sudo ufw allow from "$SUBNET" to any port 3000,3001,3002,3100 proto tcp

# En Firewalld:
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3000 protocol=tcp accept"
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3001 protocol=tcp accept"
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3002 protocol=tcp accept"
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3100 protocol=tcp accept"
sudo firewall-cmd --reload
```

### Biome o TypeScript reportan errores en archivos nuevos
- Recuerda que en archivos TypeScript de la web y librerías compartidas están prohibidas las importaciones relativas (`../` o `./`). Usa siempre alias absolutos (`@/...`).
- Ejecuta `bun run check` para validar conformidad total antes de enviar commits.
