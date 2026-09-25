import { createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

function DefaultNotFoundComponent() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        404 - Not Found
      </h2>
      <p style={{ marginTop: '0.5rem', color: '#666' }}>
        The page you are looking for does not exist.
      </p>
      <p style={{ marginTop: '1rem' }}>
        <a href="/" style={{ color: '#0066cc', textDecoration: 'underline' }}>
          Back to Home
        </a>
      </p>
    </div>
  );
}

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultNotFoundComponent: DefaultNotFoundComponent,
  });
  return router;
}
