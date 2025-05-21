"use client";

import { useState } from "react";

export function FormMoveis({ onConfirm }: { onConfirm: (data: any) => void }) {
  const [tipo, setTipo] = useState("");
  const [altura, setAltura] = useState("");
  const [largura, setLargura] = useState("");
  const [profundidade, setProfundidade] = useState("");
  const [cor, setCor] = useState("");
  const [acabamento, setAcabamento] = useState("");
  const [material, setMaterial] = useState("");
  const [ferragem, setFerragem] = useState("");
  const [temCuba, setTemCuba] = useState(false);
  const [orcarPedra, setOrcarPedra] = useState(false);
  const [modulos, setModulos] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const modulosDisponiveis = [
    "Gavetas",
    "Portas",
    "Nichos",
    "Prateleiras",
    "Basculantes",
    "Espelhos",
    "Iluminação embutida",
    "Adega",
    "Torre quente",
    "Cuba",
  ];

  const podeSalvar = tipo && altura && largura && profundidade && cor && acabamento && material && ferragem && modulos.length > 0 && foto;

  const handleModuloChange = (modulo: string) => {
    setModulos((prev) =>
      prev.includes(modulo) ? prev.filter((m) => m !== modulo) : [...prev, modulo]
    );

    if (modulo === "Cuba") {
      setTemCuba(!modulos.includes(modulo));
    }
  };

  const handleSalvar = () => {
    onConfirm({
      tipo: "moveis",
      categoria: tipo,
      altura: parseFloat(altura),
      largura: parseFloat(largura),
      profundidade: parseFloat(profundidade),
      cor,
      acabamento,
      material,
      ferragem,
      temCuba,
      orcarPedra,
      modulos,
      observacoes,
      foto,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Móveis</h2>

      <input
        type="text"
        placeholder="Tipo de móvel (ex: armário, nicho...)"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
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
        placeholder="Largura (m)"
        value={largura}
        onChange={(e) => setLargura(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Profundidade (m)"
        value={profundidade}
        onChange={(e) => setProfundidade(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="text"
        placeholder="Cor"
        value={cor}
        onChange={(e) => setCor(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="text"
        placeholder="Acabamento"
        value={acabamento}
        onChange={(e) => setAcabamento(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="text"
        placeholder="Material"
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <select
        value={ferragem}
        onChange={(e) => setFerragem(e.target.value)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Tipo de ferragem</option>
        <option value="nacional">Nacional</option>
        <option value="importada">Importada</option>
      </select>

      <div>
        <label className="block text-sm font-medium mb-1">Seleção de Módulos</label>
        <div className="grid grid-cols-2 gap-2">
          {modulosDisponiveis.map((modulo) => (
            <label key={modulo} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={modulos.includes(modulo)}
                onChange={() => handleModuloChange(modulo)}
              />
              {modulo}
            </label>
          ))}
        </div>
      </div>

      {temCuba && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={orcarPedra}
            onChange={(e) => setOrcarPedra(e.target.checked)}
          />
          Orçar pedra da cuba (abrirá formulário de granito)
        </label>
      )}

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