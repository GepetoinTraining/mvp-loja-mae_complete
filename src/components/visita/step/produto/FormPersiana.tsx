"use client";

import { useState } from "react";

export function FormPersiana({ onConfirm }: { onConfirm: (data: any) => void }) {
  const [tipo, setTipo] = useState("");
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [transpasse, setTranspasse] = useState("");
  const [referencia, setReferencia] = useState("");
  const [segundaOpcao, setSegundaOpcao] = useState("");
  const [terceiraOpcao, setTerceiraOpcao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const podeSalvar = tipo && largura && altura && transpasse && referencia;

  const handleSalvar = () => {
    onConfirm({
      tipo: "persiana",
      modelo: tipo,
      largura: parseFloat(largura),
      altura: parseFloat(altura),
      transpasse: parseFloat(transpasse),
      referencia,
      segundaOpcao,
      terceiraOpcao,
      observacoes,
    });
  };

  const opcoes = [
    "Rolo",
    "Romana",
    "Stillo",
    "Especial",
    "Horizontal 50mm Madeira",
    "Horizontal 50mm PVC",
    "Horizontal 50mm Alumínio",
    "Horizontal 25mm Alumínio",
    "Painel",
    "Blackout com guias",
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Detalhes da Persiana</h2>

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Tipo de persiana</option>
        {opcoes.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Largura (m)"
        value={largura}
        onChange={(e) => setLargura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Altura (m)"
        value={altura}
        onChange={(e) => setAltura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Transpasse da janela (cm)"
        value={transpasse}
        onChange={(e) => setTranspasse(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="text"
        placeholder="Referência selecionada"
        value={referencia}
        onChange={(e) => setReferencia(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Opções adicionais (opcional)</label>
        <input
          type="text"
          placeholder="2ª opção de referência"
          value={segundaOpcao}
          onChange={(e) => setSegundaOpcao(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="3ª opção de referência"
          value={terceiraOpcao}
          onChange={(e) => setTerceiraOpcao(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

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