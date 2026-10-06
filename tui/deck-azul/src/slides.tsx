import React from "react";

export function Presentation() {
  return (
    <div className="reveal">
      <div className="slides">
        <section>
          <h1 className="text-4xl font-bold mb-4">deck-azul</h1>
          <p className="text-xl text-gray-400">Created with unsarep slides</p>
        </section>
        <section>
          <h2 className="text-3xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2 text-left">
            <li>Fast local live preview with dev mode</li>
            <li>Instant one-command cloud deployment</li>
            <li>Organization sharing & role management</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
