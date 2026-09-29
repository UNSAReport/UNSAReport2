import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/presentations')({
  validateSearch: (search: Record<string, unknown>) => search,
  component: PresentationsLayoutComponent,
});

function PresentationsLayoutComponent() {
  return (
    <div className="w-full min-h-[calc(100vh-5rem)] relative flex flex-col">
      <Outlet />
    </div>
  );
}
