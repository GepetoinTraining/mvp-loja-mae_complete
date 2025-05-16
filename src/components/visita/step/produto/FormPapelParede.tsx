"use client";

import { useState } from "react";

export function FormPapelParede({ onConfirm }: { onConfirm: (data: any) => void }) {
  const [altura, setAltura] = useState("");
  const [largura, setLargura] = useState("");
  const [ref1, setRef1] = useState("");
  const [ref2, setRef2] = useState("");
  const [ref3, setRef3] = useState("");
  const [aberturas, setAberturas] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const podeSalvar = altura && largura && ref1 && aberturas && foto;

  const handleSalvar = () => {
    onConfirm({
      tipo: "papel_parede",
      altura: parseFloat(altura),
      largura: parseFloat(largura),
      referencias: [ref1, ref2, ref3].filter(Boolean),
      aberturas: parseInt(aberturas),
      observacoes,
      foto,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Papel de Parede</h2>

      <input
        type="number"
        placeholder="Altura da parede (m)"
        value={altura}
        onChange={(e) => setAltura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Largura da parede (m)"
        value={largura}
        onChange={(e) => setLargura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="text"
        placeholder="1ª Referência (obrigatória)"
        value={ref1}
        onChange={(e) => setRef1(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />
      <input
        type="text"
        placeholder="2ª Referência (opcional)"
        value={ref2}
        onChange={(e) => setRef2(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />
      <input
        type="text"
        placeholder="3ª Referência (opcional)"
        value={ref3}
        onChange={(e) => setRef3(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Número de aberturas na parede"
        value={aberturas}
        onChange={(e) => setAberturas(e.target.value)}
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
        <label className="block text-sm mb-1">Foto da parede</label>
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