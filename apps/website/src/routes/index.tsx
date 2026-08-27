import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <div>
      <h1>UNSAReport</h1>
      <p>Unified namespace for UNSA packages and services.</p>
      <ul>
        <li>
          <a href="/registry">Registry</a>
        </li>
        <li>
          <a href="/auth/login">Login</a>
        </li>
        <li>
          <a href="/auth/me">Current user (JSON)</a>
        </li>
        <li>
          <a href="/registry">Browse packages</a>
        </li>
      </ul>
      <h2>Quickstart</h2>
      <pre>
        {`curl http://localhost:3000/
curl http://localhost:3000/.well-known/jwks.json
curl http://localhost:3001/v1/packages`}
      </pre>
    </div>
  );
}
