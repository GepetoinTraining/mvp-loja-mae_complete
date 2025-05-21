import { LeadStatus, OrcamentoStatus, Sexo, TipoCliente } from "@prisma/client";


export {
  LeadStatus,
  OrcamentoStatus,
  Sexo,
  TipoCliente
};

export const Roles = [
  "ADMIN",
  "VENDEDOR",
  "COMPRADOR",
  "FINANCEIRO",
  "CLIENTE",
  "INSTALADOR",
  "MARKETER",
] as const;

export type Role = typeof Roles[number];

/**
 * Payload armazenado no JWT após autenticação
 */
export type AuthPayload = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  tituloLoja?: string;
};

/**
 * Tipo simplificado de Lead usado no client-side
 */
export type LeadDTO = {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  status: LeadStatus;
  vendedorId?: string;
  clienteId?: string;
  cliente?: {
    id: string;
    nome: string;
  };
};

/**
 * Tipo simplificado de Visita usado no client-side
 */
export type VisitaDTO = {
  id: string;
  dataHora: string;
  tipoVisita?: string;
  cliente: {
    id: string;
    nome: string;
  };
};

/**
 * Tipo simplificado de Item de Orçamento usado no client-side
 */
export type ItemOrcamentoDTO = {
  id: string;
  tipoProduto: string;
  descricao: string;
  largura?: number;
  altura?: number;
  metragem?: number;
  precoUnitario?: number;
  precoFinal?: number;
};

/**
 * Tipo simplificado de Orçamento usado no client-side
 */
export type OrcamentoDTO = {
  id: string;
  clienteId: string;
  vendedorId?: string;
  status: OrcamentoStatus;
  observacoes?: string;
  createdAt: string;
  itens: ItemOrcamentoDTO[];
};

/**
 * Tipo simplificado de FollowUp usado no client-side
 */
export type FollowUpDTO = {
  id: string;
  clienteId: string;
  userId: string;
  mensagem: string;
  criadoEm: string;
};

/**
 * Tipo simplificado de Cliente usado no client-side
 */
export type ClienteDTO = {
  id: string;
  nome: string;
  nomeSocial?: string;
  telefone: string;
  email?: string;
  cpf?: string;
  aniversario?: string;
  fotoUrl?: string;
  sexo?: Sexo;
  cep?: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  tipo: TipoCliente;
  origemLead?: string;
  interesseEm?: string[];
  observacoes?: string;
  visitas?: VisitaDTO[];
  orcamentos?: OrcamentoDTO[];
  leads?: LeadDTO[];
  followUps?: FollowUpDTO[];
};

export interface LeadsState {
  /** Mapa de status para lista de leads */
  leadsByStatus: Record<LeadStatus, LeadDTO[]>;
  /** Atualiza todo o mapa leadsByStatus */
  setLeadsByStatus: (leadsByStatus: Record<LeadStatus, LeadDTO[]>) => void;
  /** Busca leads por status online */
  fetchLeadsByStatus: (status?: LeadStatus) => Promise<void>;
  
  // campos adicionais (opcionais) para sua store:
  isLoading?: boolean;
  error?: string | null;
  // outras ações que desejar adicionar
}