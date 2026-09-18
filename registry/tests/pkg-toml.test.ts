import { describe, expect, it } from 'bun:test';
import type { ValidateFilesContext } from '@/lib/pkg-toml';
import { expandGlobs, parsePkgToml, validatePkgToml } from '@/lib/pkg-toml';
import { ValidationError } from '@/middleware/error-handler';

const BASE_TOML = `
[package]
name = "cardo"
version = "1.2.0"
entrypoint = "lib.typ"
displayName = "Cardo"
description = "Report components"
tags = ["Theme", "Layout"]
command_prefix = "cardo"

[components]
files = ["*.typ", "assets/**/*"]
depends_on = ["theme ^1.0.0", "utils >=1.0.0 <2.0.0"]

[templates]
files = ["template/**/*"]

[commands.greet]
description = "Say hi"
commands = ["echo hi"]
default_select = true

[hooks-suggest]
build = ["cardo:greet"]

[config-schema.accent]
type = "string"
required = true
doc = "Accent color"
`;

const PRESENT_FILES = [
  'lib.typ',
  'helpers.typ',
  'assets/logo.png',
  'template/report.typ',
];

function filesCtx(
  overrides: Record<string, string> = {},
  files: string[] = PRESENT_FILES,
) {
  const contents: Record<string, string> = {
    'lib.typ': '#let card(body) = body',
    'helpers.typ': '#let help() = 1',
    'assets/logo.png': 'png-bytes',
    'template/report.typ': '#import "/components/cardo/lib.typ"',
    ...overrides,
  };
  return {
    presentFiles: files,
    readFile: (path: string) => contents[path],
  };
}

function parseValid(extraCtx?: ValidateFilesContext) {
  return validatePkgToml(parsePkgToml(BASE_TOML), extraCtx ?? filesCtx());
}

describe('pkg.toml validation', () => {
  it('validates a complete pkg.toml document', () => {
    const pkg = parseValid();
    expect(pkg.name).toBe('cardo');
    expect(pkg.version).toBe('1.2.0');
    expect(pkg.entrypoint).toBe('lib.typ');
    expect(pkg.displayName).toBe('Cardo');
    expect(pkg.tags).toEqual(['theme', 'layout']);
    expect(pkg.commandPrefix).toBe('cardo');
    expect(pkg.componentGlobs).toEqual(['*.typ', 'assets/**/*']);
    expect(pkg.dependsOn).toEqual([
      { name: 'theme', range: '^1.0.0' },
      { name: 'utils', range: '>=1.0.0 <2.0.0' },
    ]);
    expect(pkg.templateGlobs).toEqual(['template/**/*']);
    expect(pkg.commands.greet.defaultSelect).toBe(true);
    expect(pkg.hooksSuggest).toEqual({ build: ['cardo:greet'] });
    expect(pkg.configSchema.accent.type).toBe('string');
  });

  it('validates structure without publish context', () => {
    const pkg = validatePkgToml(parsePkgToml(BASE_TOML));
    expect(pkg.name).toBe('cardo');
  });

  it('rejects invalid TOML text', () => {
    expect(() => parsePkgToml('[package')).toThrow(ValidationError);
    expect(() => parsePkgToml('')).toThrow(ValidationError);
  });

  it('rejects names outside [a-z0-9-] slug shape', () => {
    for (const name of ['Invalid_Name!', 'ab', 'has_underscore', 'UPPER']) {
      const raw = parsePkgToml(
        BASE_TOML.replace('name = "cardo"', `name = "${name}"`),
      );
      expect(() => validatePkgToml(raw)).toThrow(ValidationError);
    }
  });

  it('rejects invalid semver version and ranges', () => {
    const badVersion = parsePkgToml(
      BASE_TOML.replace('version = "1.2.0"', 'version = "not-a-version"'),
    );
    expect(() => validatePkgToml(badVersion)).toThrow(ValidationError);

    const badRange = parsePkgToml(
      BASE_TOML.replace('"theme ^1.0.0"', '"theme not-a-range!!!"'),
    );
    expect(() => validatePkgToml(badRange)).toThrow(ValidationError);
  });

  it('accepts full semver ranges in depends_on', () => {
    const raw = parsePkgToml(
      BASE_TOML.replace(
        'depends_on = ["theme ^1.0.0", "utils >=1.0.0 <2.0.0"]',
        'depends_on = ["theme >=1.0.0 <2.0.0 || >=3.0.0"]',
      ),
    );
    const pkg = validatePkgToml(raw);
    expect(pkg.dependsOn[0].range).toBe('>=1.0.0 <2.0.0 || >=3.0.0');
  });

  it('rejects malformed depends_on entries', () => {
    for (const entry of ['theme', 'Bad_Name ^1.0.0']) {
      const raw = parsePkgToml(
        BASE_TOML.replace('"theme ^1.0.0"', `"${entry}"`),
      );
      expect(() => validatePkgToml(raw)).toThrow(ValidationError);
    }
  });

  it('rejects absolute or escaping entrypoint', () => {
    for (const entrypoint of ['/lib.typ', '../lib.typ']) {
      const raw = parsePkgToml(
        BASE_TOML.replace(
          'entrypoint = "lib.typ"',
          `entrypoint = "${entrypoint}"`,
        ),
      );
      expect(() => validatePkgToml(raw)).toThrow(ValidationError);
    }
  });

  it('rejects empty components files and bad globs', () => {
    const empty = parsePkgToml(
      BASE_TOML.replace('files = ["*.typ", "assets/**/*"]', 'files = []'),
    );
    expect(() => validatePkgToml(empty)).toThrow(ValidationError);

    const absolute = parsePkgToml(
      BASE_TOML.replace('"assets/**/*"', '"/assets/**/*"'),
    );
    expect(() => validatePkgToml(absolute)).toThrow(ValidationError);
  });

  it('allows empty templates files', () => {
    const raw = parsePkgToml(
      BASE_TOML.replace('files = ["template/**/*"]', 'files = []'),
    );
    const pkg = validatePkgToml(raw, filesCtx());
    expect(pkg.templateGlobs).toEqual([]);
  });

  it('rejects legacy allow_read/allow_write keys', () => {
    const raw = parsePkgToml(`${BASE_TOML}\nallow_read = ["x"]\n`);
    expect(() => validatePkgToml(raw)).toThrow(ValidationError);
  });

  it('rejects unknown top-level and section keys', () => {
    const raw = parsePkgToml(`${BASE_TOML}\n[scripts]\nfoo = 1\n`);
    expect(() => validatePkgToml(raw)).toThrow(ValidationError);
  });

  it('rejects hooks-suggest init binding and prepare standard', () => {
    const init = parsePkgToml(
      BASE_TOML.replace('build = ["cardo:greet"]', 'init = ["cardo:greet"]'),
    );
    expect(() => validatePkgToml(init)).toThrow(ValidationError);

    const prepare = parsePkgToml(
      BASE_TOML.replace('build = ["cardo:greet"]', 'prepare = ["cardo:greet"]'),
    );
    expect(() => validatePkgToml(prepare, filesCtx())).toThrow(/build/);
  });

  it('rejects invalid command and config-schema definitions', () => {
    const badCommand = parsePkgToml(
      BASE_TOML.replace('commands = ["echo hi"]', 'commands = []'),
    );
    expect(() => validatePkgToml(badCommand)).toThrow(ValidationError);

    const badType = parsePkgToml(
      BASE_TOML.replace('type = "string"', 'type = "float"'),
    );
    expect(() => validatePkgToml(badType)).toThrow(ValidationError);
  });

  it('rejects invalid command_prefix', () => {
    const raw = parsePkgToml(
      BASE_TOML.replace(
        'command_prefix = "cardo"',
        'command_prefix = "Bad_Prefix!"',
      ),
    );
    expect(() => validatePkgToml(raw)).toThrow(ValidationError);
  });

  it('requires each glob to match at least one uploaded file', () => {
    const raw = parsePkgToml(BASE_TOML);
    expect(() => validatePkgToml(raw, filesCtx({}, ['lib.typ']))).toThrow(
      /matches no uploaded files/,
    );
  });

  it('requires the entrypoint among matched components files', () => {
    const raw = parsePkgToml(
      BASE_TOML.replace(
        'entrypoint = "lib.typ"',
        'entrypoint = "template/report.typ"',
      ),
    );
    expect(() => validatePkgToml(raw, filesCtx())).toThrow(/entrypoint/);
  });

  it('rejects read() in template sources', () => {
    const raw = parsePkgToml(BASE_TOML);
    expect(() =>
      validatePkgToml(
        raw,
        filesCtx({ 'template/report.typ': '#let x = read("a.png")' }),
      ),
    ).toThrow(/must not call read/);
  });

  it('rejects image("...") with a path in template sources', () => {
    const raw = parsePkgToml(BASE_TOML);
    expect(() =>
      validatePkgToml(
        raw,
        filesCtx({ 'template/report.typ': '#image("img/a.png")' }),
      ),
    ).toThrow(/must not call image/);
  });

  it('rejects read(param)/image(param) on function params in components', () => {
    const raw = parsePkgToml(BASE_TOML);
    expect(() =>
      validatePkgToml(
        raw,
        filesCtx({ 'lib.typ': '#let card(img) = image(img)' }),
      ),
    ).toThrow(/function parameter/);
    expect(() =>
      validatePkgToml(raw, filesCtx({ 'lib.typ': '#let card(p) = read(p)' })),
    ).toThrow(/function parameter/);
  });

  it('allows string-literal read/image in components', () => {
    const raw = parsePkgToml(BASE_TOML);
    const pkg = validatePkgToml(
      raw,
      filesCtx({ 'lib.typ': '#let logo = image("assets/logo.png")' }),
    );
    expect(pkg.name).toBe('cardo');
  });
});

describe('glob expansion', () => {
  it('supports *, ** and ? segments', () => {
    expect(expandGlobs(['*.typ'], PRESENT_FILES)).toEqual([
      'helpers.typ',
      'lib.typ',
    ]);
    expect(expandGlobs(['assets/**/*'], PRESENT_FILES)).toEqual([
      'assets/logo.png',
    ]);
    expect(expandGlobs(['template/**/*'], PRESENT_FILES)).toEqual([
      'template/report.typ',
    ]);
    expect(expandGlobs(['?.typ'], ['a.typ', 'ab.typ'])).toEqual(['a.typ']);
  });
});
