import { describe, expect, it } from 'bun:test';
import type { ValidateFilesContext } from '@/lib/unsareport-toml';
import {
  expandGlobs,
  parseUnsareportToml,
  validateUnsareportToml,
} from '@/lib/unsareport-toml';
import { ValidationError } from '@/middleware/error-handler';

const BASE_TOML = `
[project]
config_version = 1

[package]
name = "@testscope/cardo"
version = "1.2.0"
displayName = "Cardo"
description = "Report components"
tags = ["Theme", "Layout"]
command_prefix = "cardo"

[dependencies]
"@testscope/theme" = "^1.0.0"
"@testscope/utils" = ">=1.0.0 <2.0.0"

[components]
files = ["*.typ", "assets/**/*"]

[templates]
files = ["template/**/*"]

[commands.greet]
description = "Say hi"
commands = { any = ["echo hi"], linux = ["echo hi-linux"] }

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
    'template/report.typ': '#import "/components/@testscope/cardo/lib.typ"',
    ...overrides,
  };
  return {
    presentFiles: files,
    readFile: (path: string) => contents[path],
  };
}

function parseValid(extraCtx?: ValidateFilesContext) {
  return validateUnsareportToml(
    parseUnsareportToml(BASE_TOML),
    extraCtx ?? filesCtx(),
  );
}

describe('unsareport.toml validation', () => {
  it('validates a complete unsareport.toml package document', () => {
    const pkg = parseValid();
    expect(pkg.project.configVersion).toBe(1);
    expect(pkg.name).toBe('@testscope/cardo');
    expect(pkg.version).toBe('1.2.0');
    expect(pkg.displayName).toBe('Cardo');
    expect(pkg.tags).toEqual(['theme', 'layout']);
    expect(pkg.commandPrefix).toBe('cardo');
    expect(pkg.componentGlobs).toEqual(['*.typ', 'assets/**/*']);
    expect(pkg.dependencies).toEqual({
      '@testscope/theme': '^1.0.0',
      '@testscope/utils': '>=1.0.0 <2.0.0',
    });
    expect(pkg.templateGlobs).toEqual(['template/**/*']);
    expect(pkg.commands.greet.description).toBe('Say hi');
    expect(pkg.commands.greet.commands).toEqual({
      any: ['echo hi'],
      linux: ['echo hi-linux'],
      windows: [],
      macos: [],
    });
    expect(pkg.hooksSuggest).toEqual({ build: ['cardo:greet'] });
    expect(pkg.configSchema.accent.type).toBe('string');
  });

  it('validates a scope-only unsareport.toml document', () => {
    const scopeToml = `
[project]
config_version = 1

[scope]
name = "@unsareport"
description = "Official scope"
files = ["tsconfig.json"]
`;
    const doc = validateUnsareportToml(parseUnsareportToml(scopeToml));
    expect(doc.project.configVersion).toBe(1);
    expect(doc.scope?.name).toBe('@unsareport');
    expect(doc.scope?.files).toEqual(['tsconfig.json']);
  });

  it('requires [project] config_version = 1', () => {
    const missingProject = `
[package]
name = "@testscope/cardo"
version = "1.0.0"

[components]
files = ["lib.typ"]
`;
    expect(() =>
      validateUnsareportToml(parseUnsareportToml(missingProject)),
    ).toThrow('requires a [project] table');

    const wrongVersion = `
[project]
config_version = 2

[package]
name = "@testscope/cardo"
version = "1.0.0"

[components]
files = ["lib.typ"]
`;
    expect(() =>
      validateUnsareportToml(parseUnsareportToml(wrongVersion)),
    ).toThrow('Unsupported config_version');
  });

  it('rejects unscoped package names and instructs user', () => {
    const unscopedToml = BASE_TOML.replace(
      'name = "@testscope/cardo"',
      'name = "cardo"',
    );
    expect(() =>
      validateUnsareportToml(parseUnsareportToml(unscopedToml)),
    ).toThrow(
      'Unscoped packages are not allowed. Please publish under your personal scope (@<slug>) or request a custom scope.',
    );
  });

  it('accepts valid scoped package names', () => {
    for (const name of ['@xxx/yyy', '@scope.sub/my.pkg', '@a-b/c_d']) {
      const raw = parseUnsareportToml(
        BASE_TOML.replace('name = "@testscope/cardo"', `name = "${name}"`),
      );
      const pkg = validateUnsareportToml(raw, filesCtx());
      expect(pkg.name).toBe(name);
    }
  });

  it('rejects invalid TOML text', () => {
    expect(() => parseUnsareportToml('[package')).toThrow(ValidationError);
    expect(() => parseUnsareportToml('')).toThrow(ValidationError);
  });

  it('rejects invalid semver version and ranges', () => {
    for (const badVer of ['1', '1.0', 'abc', '1.0.0.0']) {
      const raw = parseUnsareportToml(
        BASE_TOML.replace('version = "1.2.0"', `version = "${badVer}"`),
      );
      expect(() => validateUnsareportToml(raw)).toThrow(ValidationError);
    }
    const badRange = parseUnsareportToml(
      BASE_TOML.replace('"^1.0.0"', '"not-a-range"'),
    );
    expect(() => validateUnsareportToml(badRange)).toThrow(ValidationError);
  });

  it('rejects legacy allow_read/allow_write keys', () => {
    const tomlWithLegacy = `${BASE_TOML}\nallow_read = ["/etc"]\n`;
    expect(() =>
      validateUnsareportToml(parseUnsareportToml(tomlWithLegacy)),
    ).toThrow(ValidationError);
  });

  it('rejects unknown top-level keys', () => {
    const bad = `${BASE_TOML}\nextra_unknown = 42\n`;
    expect(() => validateUnsareportToml(parseUnsareportToml(bad))).toThrow(
      ValidationError,
    );
  });

  it('requires each glob to match at least one uploaded file', () => {
    const missingFile = parseUnsareportToml(
      BASE_TOML.replace(
        'files = ["*.typ", "assets/**/*"]',
        'files = ["*.typ", "missing/**/*"]',
      ),
    );
    expect(() => validateUnsareportToml(missingFile, filesCtx())).toThrow(
      'matches no uploaded files',
    );
  });
});

describe('glob expansion', () => {
  it('supports *, ** and ? segments', () => {
    const files = [
      'a.typ',
      'sub/b.typ',
      'sub/deep/c.typ',
      'img/a.png',
      'img/b.jpg',
      'doc1.md',
    ];
    expect(expandGlobs(['*.typ'], files)).toEqual(['a.typ']);
    expect(expandGlobs(['**/*.typ'], files)).toEqual([
      'a.typ',
      'sub/b.typ',
      'sub/deep/c.typ',
    ]);
    expect(expandGlobs(['img/*.png'], files)).toEqual(['img/a.png']);
    expect(expandGlobs(['doc?.md'], files)).toEqual(['doc1.md']);
  });
});

describe('unsareport.toml invalid documents', () => {
  it('rejects unknown [package] keys', () => {
    for (const key of ['entrypoint = "lib.typ"', 'default_select = true']) {
      const raw = parseUnsareportToml(
        BASE_TOML.replace('version = "1.2.0"', `version = "1.2.0"\n${key}`),
      );
      expect(() => validateUnsareportToml(raw)).toThrow(ValidationError);
    }
  });

  it('rejects unknown command os keys', () => {
    const raw = parseUnsareportToml(
      BASE_TOML.replace(
        'linux = ["echo hi-linux"]',
        'plan9 = ["echo hi-plan9"]',
      ),
    );
    expect(() => validateUnsareportToml(raw)).toThrow(/unknown/);
  });

  it('rejects empty command maps', () => {
    const raw = parseUnsareportToml(
      BASE_TOML.replace(
        'commands = { any = ["echo hi"], linux = ["echo hi-linux"] }',
        'commands = {}',
      ),
    );
    expect(() => validateUnsareportToml(raw)).toThrow(
      /at least one shell line/,
    );
  });

  it('rejects init hook suggestions', () => {
    const raw = parseUnsareportToml(
      BASE_TOML.replace('build = ["cardo:greet"]', 'init = ["cardo:greet"]'),
    );
    expect(() => validateUnsareportToml(raw)).toThrow(/init hook/);
  });

  it('rejects absolute globs', () => {
    const raw = parseUnsareportToml(
      BASE_TOML.replace(
        'files = ["*.typ", "assets/**/*"]',
        'files = ["/lib.typ"]',
      ),
    );
    expect(() => validateUnsareportToml(raw)).toThrow(/relative path/);
  });

  it('rejects empty component globs', () => {
    const raw = parseUnsareportToml(
      BASE_TOML.replace('files = ["*.typ", "assets/**/*"]', 'files = []'),
    );
    expect(() => validateUnsareportToml(raw)).toThrow(/non-empty array/);
  });
});
