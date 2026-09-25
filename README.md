# UNSAReport

Generación automatizada de informes de laboratorio, gestión de paquetes y diapositivas de presentación diseñadas para estudiantes y docentes de la Universidad Nacional de San Agustín (UNSA).

> [!WARNING]
> **Advertencia**: UNSAReport es relativamente nuevo y aún se encuentra en fase de desarrollo activo por lo que se recomienda precaución al usarlo. Asegúrate de respaldar tu trabajo y revisar los resultados antes de enviarlos.

Escribe informes académicos elegantes y reproducibles en segundos usando [Typst](https://typst.app/), sin lidiar con plantillas complejas de LaTeX ni formateo manual en Word.

La herramienta principal de línea de comandos es **`unsarep`**.

---

## Requisitos previos

Antes de instalar `unsarep`, asegúrate de tener instalado lo siguiente en tu sistema:

1. **Compilador Typst**: Consulta la sección de instalación de Typst en su [documentación oficial](https://typst.app/open-source/#download) para tu sistema operativo.
2. **Git** (recomendado para control de versiones y gestión de paquetes): Descarga e instala Git desde [git-scm.com](https://git-scm.com/downloads) o usa el gestor de paquetes de tu sistema operativo.
3. **Bun** (para uso de comandos de los paquetes de @unsareport): Descarga e instala Bun desde [bun.sh](https://bun.sh/) o usa el gestor de paquetes de tu sistema operativo.

> [!NOTE]
> Si utilizas el método de instalación con nix, Bun y Git se instalarán automáticamente junto con unsareport.

---

## Instalación

### Opción 1: Binarios precompilados (Recomendado)

Descarga el binario precompilado correspondiente a tu sistema operativo y arquitectura desde nuestros [Releases](https://github.com/UNSAReport/UNSAReport2/releases):

- **Linux** (`unsarep-linux-amd64`, `unsarep-linux-arm64`)
- **macOS** (`unsarep-darwin-amd64`, `unsarep-darwin-arm64`)
- **Windows** (`unsarep-windows-amd64.exe`)

Otorga permisos de ejecución (en Linux/macOS) y muévelo a tu `PATH`:

```bash
chmod +x unsarep-linux-amd64
sudo mv unsarep-linux-amd64 /usr/local/bin/unsarep
```

En windows, renombra el archivo a `unsarep.exe` y colócalo en un directorio incluido en tu variable de entorno `PATH`.

### Opción 2: Flake de Nix

Si utilizas Nix, `unsarep` se empaqueta con las utilidades adicionales necesarias y recomendadas:

```bash
# Ejecución ad-hoc sin instalar:
nix run github:UNSAReport/UNSAReport2 -- docs init @unsareport/epis-lab --report lab-01

# O iniciar un entorno efímero con unsarep disponible:
nix shell github:UNSAReport/UNSAReport2
```

Para incluir `unsarep` de manera declarativa en el `flake.nix` o `devShell` de tu proyecto:

```nix
{
  inputs.unsareport.url = "github:UNSAReport/UNSAReport2";

  outputs = { self, nixpkgs, unsareport, ... }: {
    # Agregar a tu devShell o a los paquetes del sistema:
    devShells.x86_64-linux.default = nixpkgs.legacyPackages.x86_64-linux.mkShell {
      packages = [ unsareport.packages.x86_64-linux.default ];
    };
  };
}
```

### Opción 3: Compilar desde el código fuente (Go 1.24+)

```bash
git clone https://github.com/UNSAReport/UNSAReport2.git
cd UNSAReport2/tui

# Si deseas compilar la versión de desarrollo más reciente, cambia a la rama `dev`:
git switch dev

go build -o unsarep ./cmd/unsarep
install -m 755 unsarep ~/.local/bin/unsarep
```

Verifica la instalación:
```bash
unsarep version
```

---

## Guía rápida 

Genera, edita en tiempo real y compila tu primer informe de laboratorio:

### 1. Inicializar la estructura del informe
Crea un nuevo proyecto a partir de un paquete de plantilla oficial (por ejemplo, `@unsareport/epis-lab`):

```bash
unsarep docs init @unsareport/epis-lab --report lab-01 --yes
cd lab-01
```

*(Si omites los parámetros en una terminal interactiva, se abrirán formularios visuales guiados).*

### 2. Vista previa en vivo mientras escribes
Inicia el compilador continuo. Cada vez que guardes tus archivos `.typ`, el PDF se actualizará al instante (si tu visualizador de PDF lo permite):

```bash
unsarep docs watch lab-01
```

### 3. Compilar el PDF final de entrega
Cuando tu informe esté listo, genera el PDF de producción definitivo:

```bash
unsarep docs build lab-01
```

---

## Comandos cotidianos

### Gestión de informes de laboratorio (`unsarep docs`)

| Comando | Descripción |
|---------|-------------|
| `unsarep docs init <pkg>` | Crea la estructura inicial para un informe o documento |
| `unsarep docs watch` | Vigila los archivos del documento y recompila el PDF al guardar |
| `unsarep docs build` | Compila el PDF final ejecutando los hooks previos configurados |
| `unsarep docs add <pkg>` | Agrega una dependencia de paquete adicional en `unsareport.toml` |
| `unsarep docs update` | Actualiza los paquetes instalados a su última versión semver compatible |
| `unsarep docs check` | Valida la configuración, la integridad del lockfile y las dependencias |
| `unsarep docs run <alias>` | Ejecuta scripts y alias definidos en el proyecto (ej. `unsarep docs run submit`) |

<!--
### Creación de diapositivas (`unsarep slides`)

Crea y visualiza presentaciones interactivas:

```bash
# Crear la estructura de una nueva presentación
unsarep slides init mi-presentacion

# Iniciar el servidor local de desarrollo con recarga en vivo
unsarep slides dev mi-presentacion

# Vincular y desplegar la presentación en la plataforma en la nube
unsarep slides link
unsarep slides deploy
```-->

---

## Plataforma Web y Publicación de Paquetes

La plataforma web de UNSAReport está disponible en **[unsareport.ynoacamino.tech](https://unsareport.ynoacamino.tech/)**.

- **Explorar paquetes**: Descubre plantillas y paquetes Typst oficiales y de la comunidad.
- **Gestión de scopes y credenciales**: Inicia sesión mediante OAuth o genera Personal Access Tokens (PATs) para flujos automatizados en la terminal.

Para autores que deseen crear y publicar paquetes reutilizables en el registro:
```bash
# Iniciar sesión vía navegador (OAuth) o token PAT
unsarep auth login

# Inicializar, validar y publicar un paquete con scope
unsarep registry init --name "@mi-scope/mi-paquete" --version 0.1.0
unsarep registry check ./mi-paquete
unsarep registry publish ./mi-paquete
```

---

## Contribuciones, Errores y Sugerencias

¿Encontraste un error, necesitas ayuda o deseas proponer una nueva plantilla de informe para tu curso o facultad?

- **Reportar un error**: Abre una issue con nuestra [Plantilla de reporte de errores](https://github.com/UNSAReport/UNSAReport2/issues/new?template=bug_report.yml).
- **Solicitar una funcionalidad**: Envía una solicitud con nuestra [Plantilla de sugerencias](https://github.com/UNSAReport/UNSAReport2/issues/new?template=feature_request.yml).
- **Configuración para desarrolladores y pull requests**: Consulta la guía técnica en [CONTRIBUTING.md](CONTRIBUTING.md) para levantar los microservicios locales, ejecutar pruebas y enviar contribuciones.

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia **GNU Affero General Public License v3.0**, consulta el archivo [LICENSE](LICENSE) para más detalles.
