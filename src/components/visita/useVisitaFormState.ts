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
  fotosGerais: File[];
  setVisitaInfo: (visitaId: string, clienteId: string) => void;
  addAmbiente: (ambiente: Ambiente) => void;
  addProdutoToAmbiente: (ambienteIndex: number, produto: Produto) => void;
  removeProdutoFromAmbiente: (ambienteIndex: number, produtoIndex: number) => void;
  updateAmbiente: (index: number, ambiente: Ambiente) => void;
  addFotoGeral: (foto: File) => void;
  reset: () => void;
}

export const useVisitaFormState = create<VisitaFormState>((set) => ({
  visitaId: null,
  clienteId: null,
  ambientes: [],
  fotosGerais: [],

  setVisitaInfo: (visitaId, clienteId) => set({ visitaId, clienteId }),

  addAmbiente: (ambiente) =>
    set((state) => ({ ambientes: [...state.ambientes, ambiente] })),

  updateAmbiente: (index, ambiente) =>
    set((state) => {
      const ambientes = [...state.ambientes];
      ambientes[index] = ambiente;
      return { ambientes };
    }),

  addProdutoToAmbiente: (ambIndex, produto) =>
    set((state) => {
      const ambientes = [...state.ambientes];
      ambientes[ambIndex].produtos.push(produto);
      return { ambientes };
    }),

  removeProdutoFromAmbiente: (ambIndex, prodIndex) =>
    set((state) => {
      const ambientes = [...state.ambientes];
      ambientes[ambIndex].produtos.splice(prodIndex, 1);
      return { ambientes };
    }),

  addFotoGeral: (foto) =>
    set((state) => ({ fotosGerais: [...state.fotosGerais, foto] })),

  reset: () =>
    set({ visitaId: null, clienteId: null, ambientes: [], fotosGerais: [] }),
}));