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
<<<<<<< HEAD
  fotosGerais: File[];
  setVisitaInfo: (visitaId: string, clienteId: string) => void;
  addAmbiente: (ambiente: Ambiente) => void;
  addProdutoToAmbiente: (ambienteIndex: number, produto: Produto) => void;
  removeProdutoFromAmbiente: (ambienteIndex: number, produtoIndex: number) => void;
  updateAmbiente: (index: number, ambiente: Ambiente) => void;
  addFotoGeral: (foto: File) => void;
=======
  setVisitaInfo: (visitaId: string | null, clienteId: string | null) => void;
  addAmbiente: (ambiente: Omit<Ambiente, "produtos">) => void;
  addProdutoToAmbiente: (index: number, produto: Produto) => void;
  updateAmbiente: (index: number, ambiente: Ambiente) => void;
>>>>>>> 6e216db275680a6025a0e6521a60d3ed5209837d
  reset: () => void;
}

export const useVisitaFormState = create<VisitaFormState>((set) => ({
  visitaId: null,
  clienteId: null,
  ambientes: [],
<<<<<<< HEAD
  fotosGerais: [],

  setVisitaInfo: (visitaId, clienteId) => set({ visitaId, clienteId }),

  addAmbiente: (ambiente) =>
    set((state) => ({ ambientes: [...state.ambientes, ambiente] })),

=======
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
>>>>>>> 6e216db275680a6025a0e6521a60d3ed5209837d
  updateAmbiente: (index, ambiente) =>
    set((state) => {
      const ambientes = [...state.ambientes];
      ambientes[index] = ambiente;
      return { ambientes };
    }),
<<<<<<< HEAD

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
=======
  reset: () => set({ visitaId: null, clienteId: null, ambientes: [] }),
}));

>>>>>>> 6e216db275680a6025a0e6521a60d3ed5209837d
