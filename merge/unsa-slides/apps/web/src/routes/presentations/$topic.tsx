import { createFileRoute } from "@tanstack/react-router";
import { presentations } from "@/lib/presentations";

export const Route = createFileRoute("/presentations/$topic")({
  validateSearch: (search: Record<string, unknown>) => search,
  component: RouteComponent,
  loader: async ({ params }) => {
    const { topic } = params;
    if (!topic) {
      throw new Error("Topic is required");
    }
    const found = presentations.find(
      (presentation) => presentation.slug === topic,
    );
    if (!found) {
      throw new Error("Presentation not found");
    }
    return { title: found.title, description: found.description };
  },
  errorComponent: ({ error }) => {
    return <div>{error.message}</div>;
  },
});

function RouteComponent() {
  const { topic } = Route.useParams();
  const Presentation = presentations.find((p) => p.slug === topic)?.component;
  if (!Presentation) {
    return null;
  }
  return <Presentation />;
}
