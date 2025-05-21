import { create } from "zustand";

interface Produto {
  tipo: string;
  [key: string]: any;
}

interface Ambiente {
  nome: string;
  observacoes?: string;
  produtos: Produto[];
}

interface VisitaFormState {
  visitaId: string | null;
  clienteId: string | null;
  ambientes: Ambiente[];
  setVisitaInfo: (visitaId: string | null, clienteId: string | null) => void;
  addAmbiente: (ambiente: Omit<Ambiente, "produtos">) => void;
  addProdutoToAmbiente: (index: number, produto: Produto) => void;
  updateAmbiente: (index: number, ambiente: Ambiente) => void;
  reset: () => void;
}

export const useVisitaFormState = create<VisitaFormState>((set) => ({
  visitaId: null,
  clienteId: null,
  ambientes: [],
  setVisitaInfo: (visitaId, clienteId) => set({ visitaId, clienteId }),
  addAmbiente: (ambiente) =>
    set((state) => ({ ambientes: [...state.ambientes, { ...ambiente, produtos: [] }] })),
  addProdutoToAmbiente: (index, produto) =>
    set((state) => {
      const ambientes = [...state.ambientes];
      const alvo = ambientes[index];
      if (!alvo) return { ambientes };
      alvo.produtos.push(produto);
      return { ambientes };
    }),
  updateAmbiente: (index, ambiente) =>
    set((state) => {
      const ambientes = [...state.ambientes];
      ambientes[index] = ambiente;
      return { ambientes };
    }),
  reset: () => set({ visitaId: null, clienteId: null, ambientes: [] }),
}));

