"use client";

import { useState } from "react";

export function StepFoto({ onNext }: { onNext: () => void }) {
  const [foto, setFoto] = useState<File | null>(null);
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Fotos do Local</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFoto(e.target.files?.[0] || null)}
      />
      <button
        className="bg-primary text-white px-4 py-2 rounded"
        onClick={onNext}
        disabled={!foto}
      >
        Próximo
      </button>
    </div>
  );
}
