import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface CodeAPIEndpointProps {
  tag?: string;
  title: string;
  subtitle?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  requestPayload?: string;
  responsePayload: string;
}

/**
 * Documentación estructurada de endpoints API con método HTTP, ruta, cuerpo de petición y respuesta JSON.
 */
export function CodeAPIEndpoint({
  tag = 'Especificación de API',
  title,
  subtitle,
  method = 'POST',
  path,
  description,
  requestPayload,
  responsePayload,
}: CodeAPIEndpointProps) {
  const methodVariant =
    method === 'GET'
      ? 'secondary'
      : method === 'POST'
        ? 'success'
        : method === 'DELETE'
          ? 'error'
          : 'accent';

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col h-full gap-4">
        {/* Barra del Endpoint */}
        <SlideCard
          variant="default"
          className="p-4 flex-row items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <SlideBadge
              variant={methodVariant}
              className="font-mono font-bold text-sm"
            >
              {method}
            </SlideBadge>
            <span className="font-mono text-lg font-bold">{path}</span>
          </div>
          <span className="text-xs opacity-75">{description}</span>
        </SlideCard>

        {/* Contenido de Request y Response */}
        <div className="flex-1 min-h-0">
          <SlideSplit
            ratio="50-50"
            gap="1.5rem"
            left={
              <SlideCard
                variant="muted"
                padding={0}
                className="h-full overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-current/10">
                  <span className="text-xs font-mono font-bold opacity-75">
                    Request Body (JSON)
                  </span>
                </div>
                <div className="p-4 overflow-auto font-mono text-xs leading-relaxed h-[calc(100%-35px)]">
                  <pre className="m-0">
                    <code>{requestPayload || '// No request body'}</code>
                  </pre>
                </div>
              </SlideCard>
            }
            right={
              <SlideCard
                variant="elevated"
                padding={0}
                className="h-full overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-current/10">
                  <span className="text-xs font-mono font-bold opacity-90">
                    Response Body (200 OK)
                  </span>
                  <SlideBadge variant="success" className="text-[10px]">
                    200 OK
                  </SlideBadge>
                </div>
                <div className="p-4 overflow-auto font-mono text-xs leading-relaxed h-[calc(100%-35px)]">
                  <pre className="m-0">
                    <code>{responsePayload}</code>
                  </pre>
                </div>
              </SlideCard>
            }
          />
        </div>
      </div>
    </SlideSection>
  );
}
