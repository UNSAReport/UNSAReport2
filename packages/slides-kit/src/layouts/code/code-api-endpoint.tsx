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
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        {/* Barra del Endpoint */}
        <SlideCard
          variant="default"
          className="p-4 flex-row items-center justify-between gap-4 min-w-0 shrink-0 overflow-hidden"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
            <SlideBadge
              variant={methodVariant}
              className="font-mono font-bold text-sm shrink-0"
            >
              {method}
            </SlideBadge>
            <span className="font-mono text-lg font-bold truncate min-w-0">
              {path}
            </span>
          </div>
          <span className="text-xs opacity-75 truncate min-w-0 max-w-[35%] shrink-0">
            {description}
          </span>
        </SlideCard>

        {/* Contenido de Request y Response */}
        <div className="flex-1 min-h-0 min-w-0 w-full overflow-hidden">
          <SlideSplit
            ratio="50-50"
            gap="1.5rem"
            className="min-h-0 flex-1"
            left={
              <SlideCard
                variant="muted"
                padding={0}
                className="h-full min-h-0 min-w-0 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-4 px-4 py-2 border-b border-current/10 shrink-0 min-w-0">
                  <span className="text-xs font-mono font-bold opacity-75 truncate min-w-0">
                    Request Body (JSON)
                  </span>
                </div>
                <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-4 font-mono text-xs leading-relaxed">
                  <pre className="m-0 h-full min-w-0 overflow-auto">
                    <code className="whitespace-pre-wrap break-all">
                      {requestPayload || '// No request body'}
                    </code>
                  </pre>
                </div>
              </SlideCard>
            }
            right={
              <SlideCard
                variant="elevated"
                padding={0}
                className="h-full min-h-0 min-w-0 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-4 px-4 py-2 border-b border-current/10 shrink-0 min-w-0">
                  <span className="text-xs font-mono font-bold opacity-90 truncate min-w-0 flex-1">
                    Response Body (200 OK)
                  </span>
                  <SlideBadge
                    variant="success"
                    className="text-[10px] shrink-0"
                  >
                    200 OK
                  </SlideBadge>
                </div>
                <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-4 font-mono text-xs leading-relaxed">
                  <pre className="m-0 h-full min-w-0 overflow-auto">
                    <code className="whitespace-pre-wrap break-all">
                      {responsePayload}
                    </code>
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
