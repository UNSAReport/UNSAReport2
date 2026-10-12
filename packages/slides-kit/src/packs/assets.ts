/**
 * Resuelve la URL pública para un asset estático de un Template Pack.
 * Por defecto usa la ruta proxy de UNSAReport (/api/slides/assets/templates/...)
 * permitiendo sobrescritura vía variable de entorno o propiedad global.
 */
export function getTemplateAssetUrl(packId: string, filename: string): string {
  // biome-ignore lint/suspicious/noExplicitAny: Soporte opcional para inyección global de runtime
  const customBase =
    (typeof window !== 'undefined' && (window as any).__UNSA_SLIDES_ASSETS_URL__) ||
    (typeof process !== 'undefined' && process.env?.VITE_SLIDES_ASSETS_URL);

  const baseUrl = customBase
    ? customBase.replace(/\/+$/, '')
    : '/api/slides/assets/templates';

  return `${baseUrl}/${packId}/${filename}`;
}
