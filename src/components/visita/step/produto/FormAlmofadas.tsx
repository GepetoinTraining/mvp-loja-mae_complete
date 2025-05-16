"use client";

import { useState } from "react";

export function FormAlmofadas({ onConfirm }: { onConfirm: (data: any) => void }) {
  const [tamanho, setTamanho] = useState("");
  const [tecidoRef, setTecidoRef] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const podeSalvar = tamanho && tecidoRef && quantidade && foto;

  const handleSalvar = () => {
    onConfirm({
      tipo: "almofadas",
      tamanho,
      tecidoRef,
      detalhes,
      quantidade: parseInt(quantidade),
      foto,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Almofadas</h2>

      <select
        value={tamanho}
        onChange={(e) => setTamanho(e.target.value)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Selecione o tamanho</option>
        <option value="35x35">35x35</option>
        <option value="40x40">40x40</option>
        <option value="45x45">45x45</option>
        <option value="outro">Outro (especifique nos detalhes)</option>
      </select>

      <input
        type="text"
        placeholder="Referência do tecido"
        value={tecidoRef}
        onChange={(e) => setTecidoRef(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Quantidade"
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <textarea
        placeholder="Detalhes adicionais (opcional)"
        value={detalhes}
        onChange={(e) => setDetalhes(e.target.value)}
        className="w-full border rounded px-3 py-2"
        rows={3}
      />

      <div>
        <label className="block text-sm mb-1">Foto do tecido ou referência</label>
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