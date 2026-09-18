import { parse as parseToml } from 'smol-toml';
import { isValidSemver, isValidSemverRange } from '@/lib/semver';
import { ValidationError } from '@/middleware/error-handler';

export const PKG_NAME_REGEX =
  /^(@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;
const COMMAND_PREFIX_REGEX = /^[a-z0-9][a-z0-9._~-]*$/;
const CONFIG_SCHEMA_TYPES = [
  'string',
  'bool',
  'int',
  'path',
  'path-list',
] as const;

export type PkgConfigSchemaType = (typeof CONFIG_SCHEMA_TYPES)[number];

export const COMMAND_OS_KEYS = ['any', 'linux', 'windows', 'macos'] as const;
export type PkgCommandOs = (typeof COMMAND_OS_KEYS)[number];
export interface PkgCommandOsMap {
  any: string[];
  linux: string[];
  windows: string[];
  macos: string[];
}
export interface PkgCommandDef {
  description: string;
  commands: PkgCommandOsMap;
}

export interface PkgConfigSchemaEntry {
  type: PkgConfigSchemaType;
  required: boolean;
  default?: unknown;
  doc?: string;
}

export interface PkgDependency {
  name: string;
  range: string;
}

export interface PkgToml {
  name: string;
  version: string;
  description?: string;
  displayName?: string;
  tags?: string[];
  commandPrefix?: string;
  componentGlobs: string[];
  dependsOn: PkgDependency[];
  templateGlobs: string[];
  commands: Record<string, PkgCommandDef>;
  hooksSuggest: Record<string, string[]>;
  configSchema: Record<string, PkgConfigSchemaEntry>;
}

export interface ValidateFilesContext {
  presentFiles: string[];
  readFile: (path: string) => string | undefined;
}

/**
 * Parses raw pkg.toml text into an unvalidated object.
 *
 * @param text - Raw pkg.toml file contents.
 * @returns Parsed TOML document as an unknown value.
 * @throws ValidationError if the text is not valid TOML or not a table.
 */
export function parsePkgToml(text: string): unknown {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new ValidationError('pkg.toml must not be empty', { field: 'pkg' });
  }
  try {
    const parsed = parseToml(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ValidationError('pkg.toml must decode to a TOML table', {
        field: 'pkg',
      });
    }
    return parsed;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new ValidationError(`Invalid TOML in pkg.toml: ${msg}`, {
      field: 'pkg',
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value: unknown, field: string, what: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`pkg.toml ${what} must be a non-empty string`, {
      field,
    });
  }
  return value.trim();
}

function rejectLegacyKeys(value: unknown, where: string): void {
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    if (key === 'allow_read' || key === 'allow_write') {
      throw new ValidationError(
        `pkg.toml ${where} uses legacy key "${key}" which is not supported; pass content explicitly instead`,
        { field: key },
      );
    }
  }
}

function validateGlobPattern(glob: string, field: string): string {
  const clean = glob.trim();
  if (clean.length === 0) {
    throw new ValidationError('pkg.toml file globs must be non-empty strings', {
      field,
    });
  }
  if (clean.startsWith('/') || clean.includes('\\')) {
    throw new ValidationError(
      `pkg.toml glob "${clean}" must be a relative path without backslashes`,
      { field },
    );
  }
  const segments = clean.split('/');
  if (segments.some((seg) => seg === '..')) {
    throw new ValidationError(
      `pkg.toml glob "${clean}" must not escape with ".."`,
      { field },
    );
  }
  return clean;
}

function validateGlobList(
  value: unknown,
  field: string,
  allowEmpty: boolean,
): string[] {
  if (value === undefined) {
    if (allowEmpty) return [];
    throw new ValidationError(
      `pkg.toml section "${field}" requires a "files" array`,
      {
        field,
      },
    );
  }
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new ValidationError(
      `pkg.toml "${field}" must be ${allowEmpty ? 'an array' : 'a non-empty array'} of glob strings`,
      { field },
    );
  }
  return value.map((entry) => {
    if (typeof entry !== 'string') {
      throw new ValidationError('pkg.toml file globs must be strings', {
        field,
      });
    }
    return validateGlobPattern(entry, field);
  });
}

function parseDependsOn(value: unknown): PkgDependency[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new ValidationError(
      'pkg.toml [components] "depends_on" must be an array of "name range" strings',
      { field: 'components.depends_on' },
    );
  }
  return value.map((entry) => {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      throw new ValidationError(
        'pkg.toml [components] "depends_on" entries must be non-empty "name range" strings',
        { field: 'components.depends_on' },
      );
    }
    const text = entry.trim();
    const spaceIdx = text.search(/\s/);
    if (spaceIdx === -1) {
      throw new ValidationError(
        `pkg.toml depends_on entry "${text}" must be "name range" (missing version range)`,
        { field: 'components.depends_on' },
      );
    }
    const name = text.slice(0, spaceIdx).trim();
    const range = text.slice(spaceIdx).trim();
    if (!PKG_NAME_REGEX.test(name)) {
      throw new ValidationError(
        `pkg.toml depends_on package name "${name}" must match ${PKG_NAME_REGEX.source}`,
        { field: 'components.depends_on' },
      );
    }
    if (!isValidSemverRange(range)) {
      throw new ValidationError(
        `pkg.toml depends_on entry "${text}" has invalid semver range "${range}"`,
        { field: 'components.depends_on' },
      );
    }
    return { name, range };
  });
}

function validateCommands(value: unknown): Record<string, PkgCommandDef> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    throw new ValidationError('pkg.toml [commands] must be a table', {
      field: 'commands',
    });
  }
  const out: Record<string, PkgCommandDef> = {};
  for (const [cmdName, rawDef] of Object.entries(value)) {
    const field = `commands.${cmdName}`;
    if (!isRecord(rawDef)) {
      throw new ValidationError(`pkg.toml [${field}] must be a table`, {
        field,
      });
    }
    const allowed: Record<string, true> = {
      description: true,
      commands: true,
    };
    for (const key of Object.keys(rawDef)) {
      if (!allowed[key]) {
        throw new ValidationError(
          `pkg.toml [${field}] has unknown key "${key}"`,
          {
            field,
          },
        );
      }
    }
    const description = requireString(
      rawDef.description,
      field,
      `[${field}] "description"`,
    );
    out[cmdName] = {
      description,
      commands: validateCommandOsMap(cmdName, rawDef.commands),
    };
  }
  return out;
}

function validateCommandOsMap(
  cmdName: string,
  value: unknown,
): PkgCommandOsMap {
  const field = `commands.${cmdName}.commands`;
  if (!isRecord(value)) {
    throw new ValidationError(
      `pkg.toml [${field}] must be a table with optional keys any, linux, windows, macos`,
      { field },
    );
  }
  const commands: PkgCommandOsMap = {
    any: [],
    linux: [],
    windows: [],
    macos: [],
  };
  for (const [os, lines] of Object.entries(value)) {
    if (!(COMMAND_OS_KEYS as readonly string[]).includes(os)) {
      throw new ValidationError(
        `pkg.toml [${field}.${os}] is unknown: expected one of any, linux, windows, macos`,
        { field: `${field}.${os}` },
      );
    }
    if (!Array.isArray(lines)) {
      throw new ValidationError(
        `pkg.toml [${field}.${os}] must be an array of shell lines`,
        { field: `${field}.${os}` },
      );
    }
    commands[os as PkgCommandOs] = lines.map((line) => {
      if (typeof line !== 'string' || line.trim().length === 0) {
        throw new ValidationError(
          `pkg.toml [${field}.${os}] entries must be non-empty strings`,
          { field: `${field}.${os}` },
        );
      }
      return line;
    });
  }
  const total =
    commands.any.length +
    commands.linux.length +
    commands.windows.length +
    commands.macos.length;
  if (total === 0) {
    throw new ValidationError(
      `pkg.toml [${field}] must define at least one shell line`,
      { field },
    );
  }
  return commands;
}

function validateHooksSuggest(value: unknown): Record<string, string[]> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    throw new ValidationError('pkg.toml [hooks-suggest] must be a table', {
      field: 'hooks-suggest',
    });
  }
  const out: Record<string, string[]> = {};
  for (const [standard, rawList] of Object.entries(value)) {
    const field = `hooks-suggest.${standard}`;
    if (standard === 'init') {
      throw new ValidationError(
        'pkg.toml [hooks-suggest.init] is forbidden: packages cannot bind to the init hook',
        { field },
      );
    }
    if (standard === 'prepare') {
      throw new ValidationError(
        'pkg.toml [hooks-suggest.prepare] was renamed: use [hooks-suggest.build] instead',
        { field },
      );
    }
    if (!Array.isArray(rawList)) {
      throw new ValidationError(
        `pkg.toml [${field}] must be an array of command aliases`,
        {
          field,
        },
      );
    }
    out[standard] = rawList.map((alias) => {
      if (typeof alias !== 'string' || alias.trim().length === 0) {
        throw new ValidationError(
          `pkg.toml [${field}] entries must be non-empty command aliases`,
          { field },
        );
      }
      if (alias.trim() === 'init') {
        throw new ValidationError(
          `pkg.toml [${field}] cannot suggest binding to the init hook`,
          { field },
        );
      }
      return alias.trim();
    });
  }
  return out;
}

function validateConfigSchema(
  value: unknown,
): Record<string, PkgConfigSchemaEntry> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    throw new ValidationError('pkg.toml [config-schema] must be a table', {
      field: 'config-schema',
    });
  }
  const allowedTypes: readonly string[] = CONFIG_SCHEMA_TYPES;
  const out: Record<string, PkgConfigSchemaEntry> = {};
  for (const [key, rawEntry] of Object.entries(value)) {
    const field = `config-schema.${key}`;
    if (!isRecord(rawEntry)) {
      throw new ValidationError(`pkg.toml [${field}] must be a table`, {
        field,
      });
    }
    const allowed: Record<string, true> = {
      type: true,
      required: true,
      default: true,
      doc: true,
    };
    for (const k of Object.keys(rawEntry)) {
      if (!allowed[k]) {
        throw new ValidationError(
          `pkg.toml [${field}] has unknown key "${k}"`,
          {
            field,
          },
        );
      }
    }
    if (
      typeof rawEntry.type !== 'string' ||
      !allowedTypes.includes(rawEntry.type)
    ) {
      throw new ValidationError(
        `pkg.toml [${field}] "type" must be one of ${allowedTypes.join('|')}`,
        { field },
      );
    }
    let required = false;
    if (rawEntry.required !== undefined) {
      if (typeof rawEntry.required !== 'boolean') {
        throw new ValidationError(
          `pkg.toml [${field}] "required" must be a boolean`,
          {
            field,
          },
        );
      }
      required = rawEntry.required;
    }
    const entry: PkgConfigSchemaEntry = {
      type: rawEntry.type as PkgConfigSchemaType,
      required,
    };
    if (rawEntry.default !== undefined) entry.default = rawEntry.default;
    if (rawEntry.doc !== undefined) {
      if (typeof rawEntry.doc !== 'string') {
        throw new ValidationError(
          `pkg.toml [${field}] "doc" must be a string`,
          {
            field,
          },
        );
      }
      entry.doc = rawEntry.doc;
    }
    out[key] = entry;
  }
  return out;
}

/**
 * Validates a parsed pkg.toml document against the registry schema.
 * When `filesCtx` is provided, publish checks also run: every glob must
 * match at least one uploaded file, and Typst content scans (template
 * substring scan + component param scan) apply.
 *
 * @param raw - Parsed pkg.toml document (output of parsePkgToml).
 * @param filesCtx - Optional uploaded-file context for publish validation.
 * @returns Validated and normalized PkgToml.
 * @throws ValidationError on any schema or publish-check violation.
 */
export function validatePkgToml(
  raw: unknown,
  filesCtx?: ValidateFilesContext,
): PkgToml {
  if (!isRecord(raw)) {
    throw new ValidationError('pkg.toml must decode to a TOML table', {
      field: 'pkg',
    });
  }
  rejectLegacyKeys(raw, 'top level');

  const allowedTop: Record<string, true> = {
    package: true,
    components: true,
    templates: true,
    commands: true,
    'hooks-suggest': true,
    'config-schema': true,
  };
  for (const key of Object.keys(raw)) {
    if (!allowedTop[key]) {
      throw new ValidationError(`pkg.toml has unknown top-level key "${key}"`, {
        field: key,
      });
    }
  }

  const packageRaw = raw.package;
  if (!isRecord(packageRaw)) {
    throw new ValidationError('pkg.toml requires a [package] table', {
      field: 'package',
    });
  }
  rejectLegacyKeys(packageRaw, '[package]');
  const allowedPackage: Record<string, true> = {
    name: true,
    version: true,
    description: true,
    displayName: true,
    tags: true,
    command_prefix: true,
  };
  for (const key of Object.keys(packageRaw)) {
    if (!allowedPackage[key]) {
      throw new ValidationError(`pkg.toml [package] has unknown key "${key}"`, {
        field: 'package',
      });
    }
  }

  const name = requireString(
    packageRaw.name,
    'package.name',
    '[package] "name"',
  );
  if (name.length < 3 || name.length > 64) {
    throw new ValidationError(
      'pkg.toml [package] "name" must be between 3 and 64 characters',
      {
        field: 'package.name',
      },
    );
  }
  if (!PKG_NAME_REGEX.test(name)) {
    throw new ValidationError(
      'pkg.toml [package] "name" must be lowercase URL-safe ([a-z0-9._~-]), optionally scoped as "@scope/name" (e.g. "cardo", "@xxx/yyy", "my.pkg")',
      { field: 'package.name' },
    );
  }

  const version = requireString(
    packageRaw.version,
    'package.version',
    '[package] "version"',
  );
  if (!isValidSemver(version)) {
    throw new ValidationError(
      `pkg.toml [package] "version" is not valid semver: '${version}'`,
      {
        field: 'package.version',
      },
    );
  }

  let description: string | undefined;
  if (packageRaw.description !== undefined) {
    const desc = requireString(
      packageRaw.description,
      'package.description',
      '[package] "description"',
    );
    if (desc.length > 2048) {
      throw new ValidationError(
        'pkg.toml [package] "description" max length is 2048 characters',
        {
          field: 'package.description',
        },
      );
    }
    description = desc;
  }

  let displayName: string | undefined;
  if (packageRaw.displayName !== undefined) {
    const disp = requireString(
      packageRaw.displayName,
      'package.displayName',
      '[package] "displayName"',
    );
    if (disp.length > 128) {
      throw new ValidationError(
        'pkg.toml [package] "displayName" must be between 1 and 128 characters',
        { field: 'package.displayName' },
      );
    }
    displayName = disp;
  }

  let tags: string[] | undefined;
  if (packageRaw.tags !== undefined) {
    if (!Array.isArray(packageRaw.tags)) {
      throw new ValidationError(
        'pkg.toml [package] "tags" must be an array of strings',
        {
          field: 'package.tags',
        },
      );
    }
    tags = packageRaw.tags.map((tag) => {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        throw new ValidationError(
          'pkg.toml [package] "tags" entries must be non-empty strings',
          {
            field: 'package.tags',
          },
        );
      }
      return tag.trim().toLowerCase();
    });
  }

  let commandPrefix: string | undefined;
  if (packageRaw.command_prefix !== undefined) {
    const prefix = requireString(
      packageRaw.command_prefix,
      'package.command_prefix',
      '[package] "command_prefix"',
    );
    if (!COMMAND_PREFIX_REGEX.test(prefix)) {
      throw new ValidationError(
        'pkg.toml [package] "command_prefix" must match [a-z0-9._~-] (lowercase URL-safe part, no scope)',
        { field: 'package.command_prefix' },
      );
    }
    commandPrefix = prefix;
  }

  const componentsRaw = raw.components;
  if (!isRecord(componentsRaw)) {
    throw new ValidationError('pkg.toml requires a [components] table', {
      field: 'components',
    });
  }
  rejectLegacyKeys(componentsRaw, '[components]');
  const allowedComponents: Record<string, true> = {
    files: true,
    depends_on: true,
  };
  for (const key of Object.keys(componentsRaw)) {
    if (!allowedComponents[key]) {
      throw new ValidationError(
        `pkg.toml [components] has unknown key "${key}"`,
        {
          field: 'components',
        },
      );
    }
  }
  const componentGlobs = validateGlobList(
    componentsRaw.files,
    'components.files',
    false,
  );
  const dependsOn = parseDependsOn(componentsRaw.depends_on);

  let templateGlobs: string[] = [];
  if (raw.templates !== undefined) {
    if (!isRecord(raw.templates)) {
      throw new ValidationError('pkg.toml [templates] must be a table', {
        field: 'templates',
      });
    }
    rejectLegacyKeys(raw.templates, '[templates]');
    const allowedTemplates: Record<string, true> = { files: true };
    for (const key of Object.keys(raw.templates)) {
      if (!allowedTemplates[key]) {
        throw new ValidationError(
          `pkg.toml [templates] has unknown key "${key}"`,
          {
            field: 'templates',
          },
        );
      }
    }
    templateGlobs = validateGlobList(
      raw.templates.files,
      'templates.files',
      true,
    );
  }

  const commands = validateCommands(raw.commands);
  const hooksSuggest = validateHooksSuggest(raw['hooks-suggest']);
  const configSchema = validateConfigSchema(raw['config-schema']);

  const pkg: PkgToml = {
    name,
    version,
    componentGlobs,
    dependsOn,
    templateGlobs,
    commands,
    hooksSuggest,
    configSchema,
  };
  if (description !== undefined) pkg.description = description;
  if (displayName !== undefined) pkg.displayName = displayName;
  if (tags !== undefined) pkg.tags = tags;
  if (commandPrefix !== undefined) pkg.commandPrefix = commandPrefix;

  if (filesCtx) {
    validatePublishFiles(pkg, filesCtx);
  }

  return pkg;
}

function globToRegExp(glob: string): RegExp {
  let re = '^';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') {
          re += '(?:.*/)?';
          i += 3;
        } else {
          re += '.*';
          i += 2;
        }
      } else {
        re += '[^/]*';
        i += 1;
      }
    } else if (c === '?') {
      re += '[^/]';
      i += 1;
    } else if ('+()|^$.{}[]\\'.includes(c)) {
      re += `\\${c}`;
      i += 1;
    } else {
      re += c;
      i += 1;
    }
  }
  return new RegExp(`${re}$`);
}

/**
 * Expands glob patterns against a list of relative file paths.
 *
 * @param globs - Glob patterns (supports *, **, ?).
 * @param files - Candidate relative file paths.
 * @returns Sorted unique matched paths.
 */
export function expandGlobs(globs: string[], files: string[]): string[] {
  const matched = new Set<string>();
  for (const glob of globs) {
    const re = globToRegExp(glob);
    for (const file of files) {
      if (re.test(file)) matched.add(file);
    }
  }
  return [...matched].sort();
}

function findLineNumber(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
}

/**
 * Collects function parameter identifiers from Typst `#let name(params)` definitions.
 */
export function collectTypstParamNames(content: string): Set<string> {
  const params = new Set<string>();
  const fnPattern = /#?let\s+[A-Za-z_][\w-]*\s*\(([^)]*)\)/g;
  for (const match of content.matchAll(fnPattern)) {
    const rawParams = match[1].split(',');
    for (const raw of rawParams) {
      const head = raw.split(/[:=]/)[0]?.trim() ?? '';
      const ident = head.match(/^[A-Za-z_][\w-]*$/)?.[0];
      if (ident) params.add(ident);
    }
  }
  return params;
}

/**
 * Flags `read(x)`/`image(x)` calls in component sources where `x` is a
 * function parameter in scope. String literals are always allowed
 * (package-internal static assets).
 *
 * @returns Findings as "path:line: message" strings.
 */
export function scanComponentContent(path: string, content: string): string[] {
  const findings: string[] = [];
  const params = collectTypstParamNames(content);
  if (params.size === 0) return findings;
  const callPattern = /\b(read|image)\s*\(\s*([A-Za-z_][\w-]*)\s*[,)]/g;
  for (const match of content.matchAll(callPattern)) {
    const ident = match[2];
    if (params.has(ident)) {
      const line = findLineNumber(content, match.index);
      findings.push(
        `${path}:${line}: ${match[1]}(${ident}) passes a function parameter; callers must pass content via read(...) outside the component instead`,
      );
    }
  }
  return findings;
}

/**
 * Flags template sources that read files themselves. Templates are
 * report-side call sites: `read(` with any path argument and `image("...")`
 * with a path literal are rejected (deliberate substring scan, not AST).
 *
 * @returns Findings as "path:line: message" strings.
 */
export function scanTemplateContent(path: string, content: string): string[] {
  const findings: string[] = [];
  const readPattern = /\bread\s*\(/g;
  for (const match of content.matchAll(readPattern)) {
    const line = findLineNumber(content, match.index);
    findings.push(
      `${path}:${line}: templates must not call read(...); pass content from the report with read(...) outside the component instead`,
    );
  }
  const imagePattern = /\bimage\s*\(\s*["']/g;
  for (const match of content.matchAll(imagePattern)) {
    const line = findLineNumber(content, match.index);
    findings.push(
      `${path}:${line}: templates must not call image("...") with a path; pass content from the report instead`,
    );
  }
  return findings;
}

function validatePublishFiles(pkg: PkgToml, ctx: ValidateFilesContext): void {
  for (const file of ctx.presentFiles) {
    if (
      file.startsWith('/') ||
      file.includes('\\') ||
      file.split('/').some((seg) => seg === '..')
    ) {
      throw new ValidationError(
        `Uploaded file path "${file}" escapes the package root`,
        { field: 'components' },
      );
    }
  }

  for (const glob of pkg.componentGlobs) {
    if (expandGlobs([glob], ctx.presentFiles).length === 0) {
      throw new ValidationError(
        `pkg.toml [components] glob "${glob}" matches no uploaded files`,
        { field: 'components.files' },
      );
    }
  }
  for (const glob of pkg.templateGlobs) {
    if (expandGlobs([glob], ctx.presentFiles).length === 0) {
      throw new ValidationError(
        `pkg.toml [templates] glob "${glob}" matches no uploaded files`,
        { field: 'templates.files' },
      );
    }
  }

  const componentFiles = expandGlobs(pkg.componentGlobs, ctx.presentFiles);
  const templateFiles = expandGlobs(pkg.templateGlobs, ctx.presentFiles);
  for (const path of templateFiles) {
    if (!path.endsWith('.typ')) continue;
    const content = ctx.readFile(path);
    if (content === undefined) continue;
    const findings = scanTemplateContent(path, content);
    if (findings.length > 0) {
      throw new ValidationError(findings[0], { field: 'templates.files' });
    }
  }

  for (const path of componentFiles) {
    if (!path.endsWith('.typ')) continue;
    const content = ctx.readFile(path);
    if (content === undefined) continue;
    const findings = scanComponentContent(path, content);
    if (findings.length > 0) {
      throw new ValidationError(findings[0], { field: 'components.files' });
    }
  }
}
