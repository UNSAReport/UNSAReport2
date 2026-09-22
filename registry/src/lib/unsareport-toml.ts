import { parse as parseToml } from 'smol-toml';
import { isValidSemver, isValidSemverRange } from '@/lib/semver';
import { ValidationError } from '@/middleware/error-handler';

export const SCOPE_NAME_REGEX = /^@[a-z0-9][a-z0-9._~-]*$/;
export const SCOPED_PKG_NAME_REGEX =
  /^@[a-z0-9][a-z0-9._~-]*\/[a-z0-9][a-z0-9._~-]*$/;
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

export interface ScopeDef {
  name: string;
  description?: string;
  files: string[];
}

export interface ProjectDef {
  configVersion: number;
  typstEntry?: string;
}

export interface UnsareportToml {
  project: ProjectDef;
  scope?: ScopeDef;
  name?: string;
  version?: string;
  description?: string;
  displayName?: string;
  tags?: string[];
  commandPrefix?: string;
  componentGlobs: string[];
  dependencies: Record<string, string>;
  templateGlobs: string[];
  commands: Record<string, PkgCommandDef>;
  hooksSuggest: Record<string, string[]>;
  configSchema: Record<string, PkgConfigSchemaEntry>;
}

export type PkgToml = UnsareportToml;

export interface ValidateFilesContext {
  presentFiles: string[];
  readFile: (path: string) => string | undefined;
}

export function parseUnsareportToml(text: string): unknown {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new ValidationError('unsareport.toml must not be empty', {
      field: 'manifest',
    });
  }
  try {
    const parsed = parseToml(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ValidationError('unsareport.toml must decode to a TOML table', {
        field: 'manifest',
      });
    }
    return parsed;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new ValidationError(`Invalid TOML in unsareport.toml: ${msg}`, {
      field: 'manifest',
    });
  }
}

export const parsePkgToml = parseUnsareportToml;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value: unknown, field: string, what: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(
      `unsareport.toml ${what} must be a non-empty string`,
      {
        field,
      },
    );
  }
  return value.trim();
}

function rejectLegacyKeys(value: unknown, where: string): void {
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    if (key === 'allow_read' || key === 'allow_write') {
      throw new ValidationError(
        `unsareport.toml ${where} uses legacy key "${key}" which is not supported; pass content explicitly instead`,
        { field: key },
      );
    }
  }
}

function validateGlobPattern(glob: string, field: string): string {
  const clean = glob.trim();
  if (clean.length === 0) {
    throw new ValidationError(
      'unsareport.toml file globs must be non-empty strings',
      {
        field,
      },
    );
  }
  if (clean.startsWith('/') || clean.includes('\\')) {
    throw new ValidationError(
      `unsareport.toml glob "${clean}" must be a relative path without backslashes`,
      { field },
    );
  }
  const segments = clean.split('/');
  if (segments.some((seg) => seg === '..')) {
    throw new ValidationError(
      `unsareport.toml glob "${clean}" must not escape with ".."`,
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
      `unsareport.toml section "${field}" requires a "files" array`,
      {
        field,
      },
    );
  }
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new ValidationError(
      `unsareport.toml "${field}" must be ${allowEmpty ? 'an array' : 'a non-empty array'} of glob strings`,
      { field },
    );
  }
  return value.map((entry) => {
    if (typeof entry !== 'string') {
      throw new ValidationError('unsareport.toml file globs must be strings', {
        field,
      });
    }
    return validateGlobPattern(entry, field);
  });
}

function parseDependencies(value: unknown): Record<string, string> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    throw new ValidationError(
      'unsareport.toml [dependencies] must be a table',
      {
        field: 'dependencies',
      },
    );
  }
  const out: Record<string, string> = {};
  for (const [name, range] of Object.entries(value)) {
    if (!PKG_NAME_REGEX.test(name)) {
      throw new ValidationError(
        `unsareport.toml [dependencies] package name "${name}" must match ${PKG_NAME_REGEX.source}`,
        { field: `dependencies.${name}` },
      );
    }
    if (typeof range !== 'string' || !isValidSemverRange(range)) {
      throw new ValidationError(
        `unsareport.toml [dependencies] entry "${name}" has invalid semver range "${range}"`,
        { field: `dependencies.${name}` },
      );
    }
    out[name] = range.trim();
  }
  return out;
}

function validateCommands(value: unknown): Record<string, PkgCommandDef> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    throw new ValidationError('unsareport.toml [commands] must be a table', {
      field: 'commands',
    });
  }
  const out: Record<string, PkgCommandDef> = {};
  for (const [cmdName, rawDef] of Object.entries(value)) {
    const field = `commands.${cmdName}`;
    if (!isRecord(rawDef)) {
      throw new ValidationError(`unsareport.toml [${field}] must be a table`, {
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
          `unsareport.toml [${field}] has unknown key "${key}"`,
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
      `unsareport.toml [${field}] must be a table with optional keys any, linux, windows, macos`,
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
        `unsareport.toml [${field}.${os}] is unknown: expected one of any, linux, windows, macos`,
        { field: `${field}.${os}` },
      );
    }
    if (!Array.isArray(lines)) {
      throw new ValidationError(
        `unsareport.toml [${field}.${os}] must be an array of shell lines`,
        { field: `${field}.${os}` },
      );
    }
    commands[os as PkgCommandOs] = lines.map((line) => {
      if (typeof line !== 'string' || line.trim().length === 0) {
        throw new ValidationError(
          `unsareport.toml [${field}.${os}] entries must be non-empty strings`,
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
      `unsareport.toml [${field}] must define at least one shell line`,
      { field },
    );
  }
  return commands;
}

function validateHooksSuggest(value: unknown): Record<string, string[]> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    throw new ValidationError(
      'unsareport.toml [hooks-suggest] must be a table',
      {
        field: 'hooks-suggest',
      },
    );
  }
  const out: Record<string, string[]> = {};
  for (const [standard, rawList] of Object.entries(value)) {
    const field = `hooks-suggest.${standard}`;
    if (standard === 'init') {
      throw new ValidationError(
        'unsareport.toml [hooks-suggest.init] is forbidden: packages cannot bind to the init hook',
        { field },
      );
    }
    if (standard === 'prepare') {
      throw new ValidationError(
        'unsareport.toml [hooks-suggest.prepare] was renamed: use [hooks-suggest.build] instead',
        { field },
      );
    }
    if (!Array.isArray(rawList)) {
      throw new ValidationError(
        `unsareport.toml [${field}] must be an array of command aliases`,
        {
          field,
        },
      );
    }
    out[standard] = rawList.map((alias) => {
      if (typeof alias !== 'string' || alias.trim().length === 0) {
        throw new ValidationError(
          `unsareport.toml [${field}] entries must be non-empty command aliases`,
          { field },
        );
      }
      if (alias.trim() === 'init') {
        throw new ValidationError(
          `unsareport.toml [${field}] cannot suggest binding to the init hook`,
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
    throw new ValidationError(
      'unsareport.toml [config-schema] must be a table',
      {
        field: 'config-schema',
      },
    );
  }
  const allowedTypes: readonly string[] = CONFIG_SCHEMA_TYPES;
  const out: Record<string, PkgConfigSchemaEntry> = {};
  for (const [key, rawEntry] of Object.entries(value)) {
    const field = `config-schema.${key}`;
    if (!isRecord(rawEntry)) {
      throw new ValidationError(`unsareport.toml [${field}] must be a table`, {
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
          `unsareport.toml [${field}] has unknown key "${k}"`,
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
        `unsareport.toml [${field}] "type" must be one of ${allowedTypes.join('|')}`,
        { field },
      );
    }
    let required = false;
    if (rawEntry.required !== undefined) {
      if (typeof rawEntry.required !== 'boolean') {
        throw new ValidationError(
          `unsareport.toml [${field}] "required" must be a boolean`,
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
          `unsareport.toml [${field}] "doc" must be a string`,
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

export function validateUnsareportToml(
  raw: unknown,
  filesCtx?: ValidateFilesContext,
): UnsareportToml {
  if (!isRecord(raw)) {
    throw new ValidationError('unsareport.toml must decode to a TOML table', {
      field: 'manifest',
    });
  }
  rejectLegacyKeys(raw, 'top level');

  const allowedTop: Record<string, true> = {
    project: true,
    package: true,
    scope: true,
    components: true,
    templates: true,
    commands: true,
    'hooks-suggest': true,
    'config-schema': true,
    dependencies: true,
  };
  for (const key of Object.keys(raw)) {
    if (!allowedTop[key]) {
      throw new ValidationError(
        `unsareport.toml has unknown top-level key "${key}"`,
        {
          field: key,
        },
      );
    }
  }

  if (!isRecord(raw.project)) {
    throw new ValidationError('unsareport.toml requires a [project] table', {
      field: 'project',
    });
  }
  const configVersion = raw.project.config_version;
  if (configVersion === undefined || configVersion === null) {
    throw new ValidationError(
      'unsareport.toml requires [project] "config_version" = 1',
      { field: 'project.config_version' },
    );
  }
  if (typeof configVersion !== 'number' || configVersion !== 1) {
    throw new ValidationError(
      `Unsupported config_version ${configVersion} in unsareport.toml (supported: 1)`,
      { field: 'project.config_version' },
    );
  }

  const project: ProjectDef = {
    configVersion: 1,
  };
  if (raw.project.typst_entry !== undefined) {
    project.typstEntry = requireString(
      raw.project.typst_entry,
      'project.typst_entry',
      '[project] "typst_entry"',
    );
  }

  let scope: ScopeDef | undefined;
  if (raw.scope !== undefined) {
    if (!isRecord(raw.scope)) {
      throw new ValidationError('unsareport.toml [scope] must be a table', {
        field: 'scope',
      });
    }
    const scopeName = requireString(
      raw.scope.name,
      'scope.name',
      '[scope] "name"',
    );
    if (!SCOPE_NAME_REGEX.test(scopeName)) {
      throw new ValidationError(
        'unsareport.toml [scope] "name" must match @scope format (e.g. "@unsareport")',
        { field: 'scope.name' },
      );
    }
    const files = validateGlobList(raw.scope.files, 'scope.files', false);
    scope = { name: scopeName, files };
    if (raw.scope.description !== undefined) {
      scope.description = requireString(
        raw.scope.description,
        'scope.description',
        '[scope] "description"',
      );
    }
  }

  const packageRaw = raw.package;
  if (!packageRaw && !scope) {
    throw new ValidationError(
      'unsareport.toml requires either a [package] or a [scope] table',
      { field: 'manifest' },
    );
  }

  let name: string | undefined;
  let version: string | undefined;
  let description: string | undefined;
  let displayName: string | undefined;
  let tags: string[] | undefined;
  let commandPrefix: string | undefined;
  let componentGlobs: string[] = [];
  let dependencies: Record<string, string> = {};
  let templateGlobs: string[] = [];
  let commands: Record<string, PkgCommandDef> = {};
  let hooksSuggest: Record<string, string[]> = {};
  let configSchema: Record<string, PkgConfigSchemaEntry> = {};

  if (packageRaw !== undefined) {
    if (!isRecord(packageRaw)) {
      throw new ValidationError('unsareport.toml [package] must be a table', {
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
        throw new ValidationError(
          `unsareport.toml [package] has unknown key "${key}"`,
          {
            field: 'package',
          },
        );
      }
    }

    const pkgName = requireString(
      packageRaw.name,
      'package.name',
      '[package] "name"',
    );
    if (pkgName.length < 3 || pkgName.length > 64) {
      throw new ValidationError(
        'unsareport.toml [package] "name" must be between 3 and 64 characters',
        {
          field: 'package.name',
        },
      );
    }

    if (!pkgName.startsWith('@')) {
      throw new ValidationError(
        'Unscoped packages are not allowed. Please publish under your personal scope (@<slug>) or request a custom scope.',
        { field: 'package.name' },
      );
    }
    if (!SCOPED_PKG_NAME_REGEX.test(pkgName)) {
      throw new ValidationError(
        'unsareport.toml [package] "name" must be scoped as "@scope/name" (lowercase URL-safe, [a-z0-9._~-])',
        { field: 'package.name' },
      );
    }
    name = pkgName;

    version = requireString(
      packageRaw.version,
      'package.version',
      '[package] "version"',
    );
    if (!isValidSemver(version)) {
      throw new ValidationError(
        `unsareport.toml [package] "version" is not valid semver: '${version}'`,
        {
          field: 'package.version',
        },
      );
    }

    if (packageRaw.description !== undefined) {
      const desc = requireString(
        packageRaw.description,
        'package.description',
        '[package] "description"',
      );
      if (desc.length > 2048) {
        throw new ValidationError(
          'unsareport.toml [package] "description" max length is 2048 characters',
          {
            field: 'package.description',
          },
        );
      }
      description = desc;
    }

    if (packageRaw.displayName !== undefined) {
      const disp = requireString(
        packageRaw.displayName,
        'package.displayName',
        '[package] "displayName"',
      );
      if (disp.length > 128) {
        throw new ValidationError(
          'unsareport.toml [package] "displayName" must be between 1 and 128 characters',
          { field: 'package.displayName' },
        );
      }
      displayName = disp;
    }

    if (packageRaw.tags !== undefined) {
      if (!Array.isArray(packageRaw.tags)) {
        throw new ValidationError(
          'unsareport.toml [package] "tags" must be an array of strings',
          {
            field: 'package.tags',
          },
        );
      }
      tags = packageRaw.tags.map((tag) => {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new ValidationError(
            'unsareport.toml [package] "tags" entries must be non-empty strings',
            {
              field: 'package.tags',
            },
          );
        }
        return tag.trim().toLowerCase();
      });
    }

    if (packageRaw.command_prefix !== undefined) {
      const prefix = requireString(
        packageRaw.command_prefix,
        'package.command_prefix',
        '[package] "command_prefix"',
      );
      if (!COMMAND_PREFIX_REGEX.test(prefix)) {
        throw new ValidationError(
          'unsareport.toml [package] "command_prefix" must match [a-z0-9._~-] (lowercase URL-safe part, no scope)',
          { field: 'package.command_prefix' },
        );
      }
      commandPrefix = prefix;
    }

    const componentsRaw = raw.components;
    if (!isRecord(componentsRaw)) {
      throw new ValidationError(
        'unsareport.toml requires a [components] table for packages',
        {
          field: 'components',
        },
      );
    }
    rejectLegacyKeys(componentsRaw, '[components]');
    const allowedComponents: Record<string, true> = {
      files: true,
    };
    for (const key of Object.keys(componentsRaw)) {
      if (!allowedComponents[key]) {
        throw new ValidationError(
          `unsareport.toml [components] has unknown key "${key}"`,
          {
            field: 'components',
          },
        );
      }
    }
    componentGlobs = validateGlobList(
      componentsRaw.files,
      'components.files',
      false,
    );

    if (raw.templates !== undefined) {
      if (!isRecord(raw.templates)) {
        throw new ValidationError(
          'unsareport.toml [templates] must be a table',
          {
            field: 'templates',
          },
        );
      }
      rejectLegacyKeys(raw.templates, '[templates]');
      const allowedTemplates: Record<string, true> = { files: true };
      for (const key of Object.keys(raw.templates)) {
        if (!allowedTemplates[key]) {
          throw new ValidationError(
            `unsareport.toml [templates] has unknown key "${key}"`,
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

    commands = validateCommands(raw.commands);
    hooksSuggest = validateHooksSuggest(raw['hooks-suggest']);
    configSchema = validateConfigSchema(raw['config-schema']);
  }

  dependencies = parseDependencies(raw.dependencies);

  const doc: UnsareportToml = {
    project,
    name,
    version,
    componentGlobs,
    dependencies,
    templateGlobs,
    commands,
    hooksSuggest,
    configSchema,
  };
  if (scope !== undefined) doc.scope = scope;
  if (description !== undefined) doc.description = description;
  if (displayName !== undefined) doc.displayName = displayName;
  if (tags !== undefined) doc.tags = tags;
  if (commandPrefix !== undefined) doc.commandPrefix = commandPrefix;

  if (filesCtx && doc.name) {
    validatePublishFiles(doc, filesCtx);
  }

  return doc;
}

export const validatePkgToml = validateUnsareportToml;

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

export const ASSET_CALL_PATTERN = /\b(read|image)\s*\(/g;
export const ERROR_TEMPLATE_ASSET_LITERAL_ONLY =
  'templates must not call %FN%(...); only string literals referencing bundled package assets are allowed';
export const ERROR_TEMPLATE_ASSET_RELATIVE_ONLY =
  'templates must not call %FN%("%PATH%"); only relative paths to bundled package assets are allowed';
export const ERROR_TEMPLATE_ASSET_NO_BACKSLASH =
  'templates must not call %FN%("%PATH%"); backslashes are not allowed in asset paths';
export const ERROR_TEMPLATE_ASSET_NOT_FOUND =
  'templates must not call %FN%("%PATH%"); asset not found in package';

function formatAssetError(
  template: string,
  fn: string,
  pathVal?: string,
): string {
  let res = template.replace('%FN%', fn);
  if (pathVal !== undefined) {
    res = res.replace('%PATH%', pathVal);
  }
  return res;
}

export function normalizeRelativePosixPath(rawPath: string): string | null {
  if (rawPath.startsWith('/') || rawPath.includes('\\')) {
    return null;
  }
  const parts = rawPath.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') {
      continue;
    }
    if (part === '..') {
      if (stack.length === 0) {
        return null;
      }
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}
export function normalizeArchivePath(entryName: string): string | null {
  const stripped = entryName.replace(/^[/\\]+/, '');
  if (stripped.length === 0 || stripped.includes('\\')) {
    return null;
  }
  const parts = stripped.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.') {
      continue;
    }
    if (part === '..') {
      if (stack.length === 0) {
        return null;
      }
      stack.pop();
    } else if (part.length === 0) {
      return null;
    } else {
      stack.push(part);
    }
  }
  if (stack.length === 0) {
    return null;
  }
  return stack.join('/');
}

export function resolveBundledAssetPath(
  templatePath: string,
  rawPath: string,
  presentFiles: Set<string>,
): string | null {
  if (rawPath.startsWith('/') || rawPath.includes('\\')) {
    return null;
  }

  const lastSlashIndex = templatePath.lastIndexOf('/');
  const templateDir =
    lastSlashIndex === -1 ? '' : templatePath.slice(0, lastSlashIndex);
  const fromTemplateDir =
    templateDir.length > 0 ? `${templateDir}/${rawPath}` : rawPath;
  const resolvedFromTemplate = normalizeRelativePosixPath(fromTemplateDir);
  if (resolvedFromTemplate !== null && presentFiles.has(resolvedFromTemplate)) {
    return resolvedFromTemplate;
  }

  const resolvedFromRoot = normalizeRelativePosixPath(rawPath);
  if (resolvedFromRoot !== null && presentFiles.has(resolvedFromRoot)) {
    return resolvedFromRoot;
  }

  return null;
}

export function scanTemplateContent(
  path: string,
  content: string,
  packageFiles: string[] | Set<string>,
): string[] {
  const findings: string[] = [];
  const filesSet =
    packageFiles instanceof Set ? packageFiles : new Set(packageFiles);

  for (const match of content.matchAll(ASSET_CALL_PATTERN)) {
    const fn = match[1];
    const startIndex = match.index + match[0].length;
    let idx = startIndex;
    while (idx < content.length && /\s/.test(content[idx])) {
      idx++;
    }

    if (idx >= content.length) {
      const line = findLineNumber(content, match.index);
      findings.push(
        `${path}:${line}: ${formatAssetError(ERROR_TEMPLATE_ASSET_LITERAL_ONLY, fn)}`,
      );
      continue;
    }

    const firstChar = content[idx];
    if (firstChar !== '"' && firstChar !== "'") {
      const line = findLineNumber(content, match.index);
      findings.push(
        `${path}:${line}: ${formatAssetError(ERROR_TEMPLATE_ASSET_LITERAL_ONLY, fn)}`,
      );
      continue;
    }

    const quoteChar = firstChar;
    idx++;
    let rawPath = '';
    let escaped = false;
    let terminated = false;
    let hasBackslash = false;

    while (idx < content.length) {
      const ch = content[idx];
      if (escaped) {
        rawPath += ch;
        escaped = false;
      } else if (ch === '\\') {
        hasBackslash = true;
        escaped = true;
      } else if (ch === quoteChar) {
        terminated = true;
        break;
      } else {
        rawPath += ch;
      }
      idx++;
    }

    const line = findLineNumber(content, match.index);
    if (!terminated) {
      findings.push(
        `${path}:${line}: ${formatAssetError(ERROR_TEMPLATE_ASSET_LITERAL_ONLY, fn)}`,
      );
      continue;
    }

    if (rawPath.startsWith('/')) {
      findings.push(
        `${path}:${line}: ${formatAssetError(ERROR_TEMPLATE_ASSET_RELATIVE_ONLY, fn, rawPath)}`,
      );
      continue;
    }

    if (hasBackslash || rawPath.includes('\\')) {
      findings.push(
        `${path}:${line}: ${formatAssetError(ERROR_TEMPLATE_ASSET_NO_BACKSLASH, fn, rawPath)}`,
      );
      continue;
    }

    const resolved = resolveBundledAssetPath(path, rawPath, filesSet);
    if (resolved === null) {
      findings.push(
        `${path}:${line}: ${formatAssetError(ERROR_TEMPLATE_ASSET_NOT_FOUND, fn, rawPath)}`,
      );
    }
  }

  return findings;
}

function validatePublishFiles(
  pkg: UnsareportToml,
  ctx: ValidateFilesContext,
): void {
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
        `unsareport.toml [components] glob "${glob}" matches no uploaded files`,
        { field: 'components.files' },
      );
    }
  }
  for (const glob of pkg.templateGlobs) {
    if (expandGlobs([glob], ctx.presentFiles).length === 0) {
      throw new ValidationError(
        `unsareport.toml [templates] glob "${glob}" matches no uploaded files`,
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
    const findings = scanTemplateContent(path, content, ctx.presentFiles);
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
