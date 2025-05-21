"use client";

import { useState } from "react";

export function FormGranito({ onConfirm }: { onConfirm: (data: any) => void }) {
  const [tipo, setTipo] = useState("");
  const [acabamento, setAcabamento] = useState("");
  const [espessura, setEspessura] = useState("");
  const [largura, setLargura] = useState("");
  const [profundidade, setProfundidade] = useState("");
  const [recortes, setRecortes] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const podeSalvar = tipo && acabamento && espessura && largura && profundidade && foto;

  const handleSalvar = () => {
    onConfirm({
      tipo: "granito",
      material: tipo,
      acabamento,
      espessura: parseFloat(espessura),
      largura: parseFloat(largura),
      profundidade: parseFloat(profundidade),
      recortes: recortes ? parseInt(recortes) : 0,
      observacoes,
      foto,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Detalhes da Pedra / Granito</h2>

      <input
        type="text"
        placeholder="Tipo de pedra (ex: granito, quartzo, mármore...)"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="text"
        placeholder="Acabamento (ex: polido, escovado...)"
        value={acabamento}
        onChange={(e) => setAcabamento(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Espessura (cm)"
        value={espessura}
        onChange={(e) => setEspessura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Largura da pedra (m)"
        value={largura}
        onChange={(e) => setLargura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Profundidade da pedra (m)"
        value={profundidade}
        onChange={(e) => setProfundidade(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Número de recortes (opcional)"
        value={recortes}
        onChange={(e) => setRecortes(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <textarea
        placeholder="Observações (opcional)"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        className="w-full border rounded px-3 py-2"
        rows={3}
      />

      <div>
        <label className="block text-sm mb-1">Foto da área da pedra</label>
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
        Adicionar Pedra
      </button>
    </div>
  );
}
