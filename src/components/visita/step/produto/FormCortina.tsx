"use client";

import { useState } from "react";

export function FormCortina({ onConfirm }: { onConfirm: (data: any) => void }) {
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [larguraJanela, setLarguraJanela] = useState("");
  const [alturaJanela, setAlturaJanela] = useState("");
  const [tecido, setTecido] = useState("");
  const [forro, setForro] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [mecanismo, setMecanismo] = useState("trilho_tubo");
  const [prega, setPrega] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const podeSalvar = largura && altura && tecido && larguraJanela && alturaJanela && prega;

  const handleSalvar = () => {
    onConfirm({
      tipo: "cortina",
      largura: parseFloat(largura),
      altura: parseFloat(altura),
      larguraJanela: parseFloat(larguraJanela),
      alturaJanela: parseFloat(alturaJanela),
      tecido,
      forro,
      blackout,
      mecanismo,
      prega,
      observacoes,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Detalhes da Cortina</h2>

      <input
        type="number"
        placeholder="Largura da cortina (m)"
        value={largura}
        onChange={(e) => setLargura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Altura da cortina (m)"
        value={altura}
        onChange={(e) => setAltura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Largura da janela (m)"
        value={larguraJanela}
        onChange={(e) => setLarguraJanela(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Altura da janela (m)"
        value={alturaJanela}
        onChange={(e) => setAlturaJanela(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="text"
        placeholder="Tipo de tecido"
        value={tecido}
        onChange={(e) => setTecido(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={forro}
          onChange={(e) => setForro(e.target.checked)}
        />
        Possui forro
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={blackout}
          onChange={(e) => setBlackout(e.target.checked)}
        />
        Possui blackout de tecido
      </label>

      <select
        value={mecanismo}
        onChange={(e) => setMecanismo(e.target.value)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="varao">Varão</option>
        <option value="trilho_tubo">Trilho Tubo</option>
        <option value="trilho_suico">Trilho Suíço</option>
      </select>

      <select
        value={prega}
        onChange={(e) => setPrega(e.target.value)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Tipo de prega</option>
        <option value="macho">Macho</option>
        <option value="femea">Fêmea</option>
        <option value="plissada">Plissada</option>
        <option value="americana">Americana</option>
        <option value="wave">Wave</option>
      </select>

      <textarea
        placeholder="Observações sobre este produto (opcional)"
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