"use client";

import { useState } from "react";

export function FormBoiserie({ onConfirm }: { onConfirm: (data: any) => void }) {
  const [altura, setAltura] = useState("");
  const [largura, setLargura] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [pintado, setPintado] = useState(false);
  const [desenho, setDesenho] = useState("");
  const [corteEspecial, setCorteEspecial] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const podeSalvar = altura && largura && modelo && cor && desenho && corteEspecial && foto;

  const handleSalvar = () => {
    onConfirm({
      tipo: "boiserie",
      altura: parseFloat(altura),
      largura: parseFloat(largura),
      modelo,
      cor,
      pintado,
      desenho,
      corteEspecial,
      observacoes,
      foto,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Boiserie</h2>

      <input
        type="number"
        placeholder="Altura (m)"
        value={altura}
        onChange={(e) => setAltura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Largura (m)"
        value={largura}
        onChange={(e) => setLargura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="text"
        placeholder="Modelo"
        value={modelo}
        onChange={(e) => setModelo(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

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

      <input
        type="text"
        placeholder="Desenho"
        value={desenho}
        onChange={(e) => setDesenho(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="text"
        placeholder="Corte especial (ex: ≠ 90° ou 45°)"
        value={corteEspecial}
        onChange={(e) => setCorteEspecial(e.target.value)}
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
        <label className="block text-sm mb-1">Foto do local</label>
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