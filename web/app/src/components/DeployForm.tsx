import { Link } from '@tanstack/react-router';
import { type ChangeEvent, useId, useState } from 'react';
import { Button } from '@/components/Button';
import { TextInput } from '@/components/TextInput';
import {
  deployPresentationServerFn,
  type SlidesDeployResult,
} from '@/lib/slides/client';

type Visibility = 'private' | 'org' | 'public' | 'unlisted';

const MAX_BUNDLE_BYTES = 50 * 1024 * 1024;
const SLUG_PATTERN = /^[a-z0-9-]+$/;

function fileToBase64(file: File): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
  reader.onload = () => {
    const url = String(reader.result ?? '');
    const comma = url.indexOf(',');
    resolve(comma >= 0 ? url.slice(comma + 1) : url);
  };
  reader.readAsDataURL(file);
  return promise;
}

function deployErrorHint(message: string): string {
  if (/401|403|unauthorized|forbidden/i.test(message)) {
    return `${message}. No has iniciado sesión o te falta el rol slides — inicia sesión en /auth/login o ejecuta \`unsarep slides login\`.`;
  }
  return message;
}

export function DeployForm() {
  const fileInputId = useId();
  const visibilitySelectId = useId();
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [orgSlug, setOrgSlug] = useState('');
  const [fileName, setFileName] = useState('');
  const [bundle, setBundle] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SlidesDeployResult | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setBundle(null);
      setFileName('');
      return;
    }
    if (!/\.zip$/i.test(file.name)) {
      setFormError('El bundle debe ser un archivo .zip');
      setBundle(null);
      setFileName('');
      return;
    }
    if (file.size > MAX_BUNDLE_BYTES) {
      setFormError(
        `El bundle (${file.size} bytes) supera el límite de ${MAX_BUNDLE_BYTES} bytes`,
      );
      setBundle(null);
      setFileName('');
      return;
    }
    try {
      setBundle(await fileToBase64(file));
      setFileName(file.name);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
      setBundle(null);
      setFileName('');
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSlugError(null);
    const cleanSlug = slug.trim().toLowerCase();
    if (cleanSlug.length < 2 || !SLUG_PATTERN.test(cleanSlug)) {
      setSlugError(
        'Slug inválido: usa minúsculas, números y guiones (mínimo 2 caracteres)',
      );
      return;
    }
    if (!title.trim()) {
      setFormError('El título es requerido');
      return;
    }
    if (!bundle) {
      setFormError('Selecciona un bundle .zip para publicar');
      return;
    }
    setPending(true);
    try {
      const deployed = await deployPresentationServerFn({
        data: {
          slug: cleanSlug,
          title: title.trim(),
          description: description.trim() || undefined,
          orgSlug: orgSlug.trim() || undefined,
          visibility,
          manifest: {
            name: cleanSlug,
            title: title.trim(),
            description: description.trim() || undefined,
            entrypoint: 'index.html',
            slides: [],
            assets: [],
          },
          bundle,
        },
      });
      setResult(deployed);
    } catch (err) {
      setFormError(
        deployErrorHint(err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setPending(false);
    }
  };

  if (result) {
    return (
      <section
        aria-label="Publicación exitosa"
        className="p-6 rounded-none bg-transparent border border-[#C7C7C7] space-y-3"
      >
        <h2 className="text-lg font-bold text-green-700">
          Versión v{result.version} publicada
        </h2>
        <p className="text-sm text-[#444343]">{result.message}</p>
        <Link
          to="/presentations/$slug"
          params={{ slug: result.presentationId }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-[#1351AA] text-[#E3E2DE] font-medium text-sm transition-colors duration-300 hover:bg-[#141414]"
        >
          Ver presentación →
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError ? (
        <p role="alert" className="text-sm text-red-700">
          {formError}
        </p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={fileInputId}
          className="text-xs font-bold uppercase tracking-[0.2em] text-[#7A7A7A]"
        >
          Bundle (.zip) <span aria-hidden="true">*</span>
        </label>
        <input
          id={fileInputId}
          name="bundle"
          type="file"
          accept=".zip"
          required
          onChange={handleFileChange}
          className="w-full px-3.5 py-2 rounded-none bg-transparent border border-[#C7C7C7] text-sm text-[#141414] file:mr-3 file:px-3 file:py-1.5 file:rounded-none file:border file:border-[#C7C7C7] file:bg-[#141414] file:text-[#E3E2DE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
        />
        {fileName ? (
          <p className="text-xs text-[#7A7A7A]">{fileName}</p>
        ) : (
          <p className="text-xs text-[#7A7A7A]">
            Zip generado por `unsarep slides deploy` (máx. 50 MiB)
          </p>
        )}
      </div>
      <TextInput
        label="Slug"
        name="slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="mi-presentacion"
        hint="Minúsculas, números y guiones"
        error={slugError}
        required
      />
      <TextInput
        label="Título"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Mi presentación"
        required
      />
      <TextInput
        label="Descripción"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Resumen opcional del deck"
      />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={visibilitySelectId}
          className="text-xs font-bold uppercase tracking-[0.2em] text-[#7A7A7A]"
        >
          Visibilidad
        </label>
        <select
          id={visibilitySelectId}
          name="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
          className="w-full px-3.5 py-2 rounded-none bg-transparent border border-[#C7C7C7] text-sm text-[#141414] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
        >
          <option value="private">Privada</option>
          <option value="org">Organización</option>
          <option value="public">Pública</option>
          <option value="unlisted">No listada</option>
        </select>
      </div>
      <TextInput
        label="Organización"
        name="orgSlug"
        value={orgSlug}
        onChange={(e) => setOrgSlug(e.target.value)}
        placeholder="Slug de la organización (opcional)"
        hint="Vacío = presentación personal"
      />
      <Button type="submit" disabled={pending}>
        {pending ? 'Publicando…' : 'Publicar presentación'}
      </Button>
    </form>
  );
}
