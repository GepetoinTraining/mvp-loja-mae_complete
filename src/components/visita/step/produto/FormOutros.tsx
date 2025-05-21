"use client";

import { useState } from "react";

export function FormOutros({ onConfirm }: { onConfirm: (data: any) => void }) {
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const podeSalvar = observacoes.trim().length > 0 || foto;

  const handleSalvar = () => {
    onConfirm({
      tipo: "outros",
      observacoes,
      foto,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Outros</h2>

      <textarea
        placeholder="Descreva o item ou situação..."
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        className="w-full border rounded px-3 py-2"
        rows={4}
      />

      <div>
        <label className="block text-sm mb-1">Foto (opcional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files?.[0] || null)}
        />
      </div>

      <button
        disabled={!podeSalvar}
        onClick={handleSalvar}
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
      >
        Adicionar Item</button>
    </div>
  );
}