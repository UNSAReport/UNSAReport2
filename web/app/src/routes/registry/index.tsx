import { createFileRoute, Link } from '@tanstack/react-router';
import { fetchPackagesServerFn } from '@/lib/registry/client';

export const Route = createFileRoute('/registry/')({
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) || undefined,
    tag: (search.tag as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({
    search: search.search,
    tag: search.tag,
  }),
  loader: async ({ deps }) => {
    const pkgs = await fetchPackagesServerFn({
      data: { search: deps.search, tag: deps.tag },
    }).catch(() => []);
    return { packages: pkgs };
  },
  component: RegistryIndexComponent,
});

function RegistryIndexComponent() {
  const { packages } = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <div>
      <h1>Registry</h1>
      <form method="get">
        <input
          name="search"
          placeholder="Search packages"
          defaultValue={search.search ?? ''}
        />
        <button type="submit">Search</button>
      </form>
      <p>
        <Link to="/registry/upload">Upload package</Link> (requires login)
      </p>
      {packages.length === 0 ? (
        <p>No packages</p>
      ) : (
        <ul>
          {packages.map((pkg) => (
            <li key={pkg.name}>
              <Link to="/registry/$name" params={{ name: pkg.name }}>
                {pkg.name}
              </Link>
              {pkg.displayName ? ` — ${pkg.displayName}` : ''}
              {pkg.description ? ` — ${pkg.description}` : ''}
              {pkg.tags?.length ? ` [${pkg.tags.join(', ')}]` : ''}
              {pkg.latestVersion ? ` (latest: ${pkg.latestVersion})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
