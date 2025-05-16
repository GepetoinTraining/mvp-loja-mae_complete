"use client";

import { useState } from "react";

export function FormRodape({ onConfirm }: { onConfirm: (data: any) => void }) {
  const [altura, setAltura] = useState("");
  const [metrosLineares, setMetrosLineares] = useState("");
  const [material, setMaterial] = useState("");
  const [cor, setCor] = useState("");
  const [pintado, setPintado] = useState(false);
  const [acabamento, setAcabamento] = useState("");
  const [condicaoParede, setCondicaoParede] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const podeSalvar = altura && metrosLineares && material && cor && acabamento && foto;

  const handleSalvar = () => {
    onConfirm({
      tipo: "rodape",
      altura: parseFloat(altura),
      metrosLineares: parseFloat(metrosLineares),
      material,
      cor,
      pintado,
      acabamento,
      condicaoParede,
      foto,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Rodapé</h2>

      <input
        type="number"
        placeholder="Altura do rodapé (cm)"
        value={altura}
        onChange={(e) => setAltura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Metros lineares (m)"
        value={metrosLineares}
        onChange={(e) => setMetrosLineares(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <select
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Material</option>
        <option value="mdf">MDF</option>
        <option value="pes">PES</option>
        <option value="madeira">Madeira</option>
      </select>

      <input
        type="text"
        placeholder="Cor"
        value={cor}
        onChange={(e) => setCor(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={pintado}
          onChange={(e) => setPintado(e.target.checked)}
        />
        Pintado
      </label>

      <select
        value={acabamento}
        onChange={(e) => setAcabamento(e.target.value)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Acabamento</option>
        <option value="frisado">Frisado</option>
        <option value="sem_friso">Sem friso</option>
      </select>

      <textarea
        placeholder="Observações sobre condição da parede"
        value={condicaoParede}
        onChange={(e) => setCondicaoParede(e.target.value)}
        className="w-full border rounded px-3 py-2"
        rows={3}
      />

      <div>
        <label className="block text-sm mb-1">Foto do ambiente</label>
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
        Adicionar Produto
      </button>
    </div>
  );
}