import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { requireAuthServerFn } from "@/lib/auth/server";

export const Route = createFileRoute("/registry/upload")({
  beforeLoad: async () => {
    try {
      await requireAuthServerFn();
    } catch {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: UploadComponent,
});

function UploadComponent() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/registry/v1/packages", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const data = await res.text();
      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div>
      <h1>Upload Package</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <pre style={{ color: "green" }}>{success}</pre>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="file" name="file" accept=".zip,.tgz,.tar.gz" required />
        <button type="submit">Upload</button>
      </form>
      <p>Requires authentication. File must contain manifest.json.</p>
    </div>
  );
}
