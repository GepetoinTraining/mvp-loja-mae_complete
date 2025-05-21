"use client";

import { useState } from "react";

export function FormTrilho({ onConfirm }: { onConfirm: (data: any) => void }) {
  const [largura, setLargura] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [tipo, setTipo] = useState("");
  const [lavacao, setLavacao] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);

  const podeSalvar = largura && quantidade && tipo && foto;

  const handleSalvar = () => {
    onConfirm({
      tipo: "trilho",
      largura: parseFloat(largura),
      quantidade: parseInt(quantidade),
      tipoTrilho: tipo,
      lavacao,
      foto,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Substituição de Trilho</h2>

      <input
        type="number"
        placeholder="Largura (m)"
        value={largura}
        onChange={(e) => setLargura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Quantidade de trilhos"
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="text"
        placeholder="Tipo de trilho (ex: suíço, simples, triplo...)"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={lavacao}
          onChange={(e) => setLavacao(e.target.checked)}
        />
        Incluir lavação da cortina
      </label>

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