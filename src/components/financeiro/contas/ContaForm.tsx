"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Zod Schema for Validation
const contaFormSchema = z.object({
  tipo: z.enum(["PAGAR", "RECEBER"], { required_error: "Tipo é obrigatório" }),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val.replace(",", ".")) : val),
    z.number({ invalid_type_error: "Valor inválido"}).positive("Valor deve ser positivo")
  ),
  dataVencimento: z.string().min(1, "Data de vencimento é obrigatória"), // Using string for datetime-local input
  dataPagamento: z.string().optional().nullable(),
  status: z.enum(["PENDENTE", "PAGA_PARCIALMENTE", "PAGA_TOTALMENTE", "VENCIDA", "CANCELADA"]).default("PENDENTE"),
  clienteId: z.string().cuid().optional().nullable(),
  fornecedorId: z.string().cuid().optional().nullable(),
  orcamentoId: z.string().cuid().optional().nullable(),
  pedidoCompraId: z.string().cuid().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  nossoNumero: z.string().optional().nullable(),
  codigoBarras: z.string().optional().nullable(),
  linhaDigitavel: z.string().optional().nullable(),
});

type ContaFormData = z.infer<typeof contaFormSchema>;

interface Cliente {
  id: string;
  nome: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

interface Orcamento {
  id: string;
  // Add other fields if needed for display
}

interface PedidoCompra {
  id: string;
  // Add other fields if needed for display
}

export function ContaForm() {
  const router = useRouter();
  const params = useParams();
  const contaId = params?.id as string | undefined;

  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [pedidosCompra, setPedidosCompra] = useState<PedidoCompra[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContaFormData>({
    resolver: zodResolver(contaFormSchema),
    defaultValues: {
      tipo: "RECEBER",
      descricao: "",
      valor: 0,
      dataVencimento: new Date().toISOString().substring(0, 16),
      dataPagamento: null,
      status: "PENDENTE",
      clienteId: null,
      fornecedorId: null,
      orcamentoId: null,
      pedidoCompraId: null,
      observacoes: "",
      nossoNumero: "",
      codigoBarras: "",
      linhaDigitavel: "",
    },
  });

  useEffect(() => {
    async function fetchDataDependencies() {
      try {
        // Fetch Clientes
        const clientesRes = await fetch("/api/clientes");
        if (clientesRes.ok) setClientes(await clientesRes.json());
        else console.error("Failed to fetch clientes");

        // Fetch Fornecedores
        const fornecedoresRes = await fetch("/api/fornecedores");
        if (fornecedoresRes.ok) setFornecedores(await fornecedoresRes.json());
        else console.error("Failed to fetch fornecedores");
        
        // Fetch Orcamentos (simplified for now)
        const orcamentosRes = await fetch("/api/orcamentos");
        if (orcamentosRes.ok) setOrcamentos(await orcamentosRes.json());
        else console.error("Failed to fetch orcamentos");

        // Fetch Pedidos de Compra (simplified for now)
        const pedidosRes = await fetch("/api/pedidos-compra");
        if (pedidosRes.ok) setPedidosCompra(await pedidosRes.json());
        else console.error("Failed to fetch pedidos de compra");

      } catch (error) {
        console.error("Error fetching dependencies:", error);
        toast.error("Erro ao carregar dados de apoio.");
      }
    }
    fetchDataDependencies();
  }, []);

  useEffect(() => {
    if (contaId) {
      setLoading(true);
      async function fetchContaData() {
        try {
          const response = await fetch(`/api/contas/${contaId}`);
          if (!response.ok) throw new Error("Failed to fetch conta data");
          const data = await response.json();
          reset({
            ...data,
            valor: data.valor, // Ensure number type
            dataVencimento: data.dataVencimento ? new Date(data.dataVencimento).toISOString().substring(0, 16) : "",
            dataPagamento: data.dataPagamento ? new Date(data.dataPagamento).toISOString().substring(0, 16) : null,
          });
        } catch (error) {
          console.error("Error fetching conta data:", error);
          toast.error("Erro ao carregar dados da conta.");
          router.push("/financeiro/contas");
        } finally {
          setLoading(false);
        }
      }
      fetchContaData();
    }
  }, [contaId, reset, router]);

  const onSubmit = async (data: ContaFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        dataVencimento: new Date(data.dataVencimento).toISOString(),
        dataPagamento: data.dataPagamento ? new Date(data.dataPagamento).toISOString() : null,
      };

      const response = await fetch(
        contaId ? `/api/contas/${contaId}` : "/api/contas",
        {
          method: contaId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save conta");
      }

      toast.success(`Conta ${contaId ? "atualizada" : "criada"} com sucesso!`);
      router.push("/financeiro/contas");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving conta:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (contaId && loading) return <p>Carregando dados da conta...</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{contaId ? "Editar Conta" : "Nova Conta"}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEBER">A Receber</SelectItem>
                    <SelectItem value="PAGAR">A Pagar</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo && <p className="text-red-500 text-sm">{errors.tipo.message}</p>}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Controller name="descricao" control={control} render={({ field }) => <Input {...field} />} />
            {errors.descricao && <p className="text-red-500 text-sm">{errors.descricao.message}</p>}
          </div>

          <div>
            <Label htmlFor="valor">Valor (R$)</Label>
            <Controller name="valor" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} />} />
            {errors.valor && <p className="text-red-500 text-sm">{errors.valor.message}</p>}
          </div>

          <div>
            <Label htmlFor="dataVencimento">Data de Vencimento</Label>
            <Controller name="dataVencimento" control={control} render={({ field }) => <Input type="datetime-local" {...field} />} />
            {errors.dataVencimento && <p className="text-red-500 text-sm">{errors.dataVencimento.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="PAGA_PARCIALMENTE">Paga Parcialmente</SelectItem>
                    <SelectItem value="PAGA_TOTALMENTE">Paga Totalmente</SelectItem>
                    <SelectItem value="VENCIDA">Vencida</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>

          <div>
            <Label htmlFor="dataPagamento">Data de Pagamento</Label>
            <Controller name="dataPagamento" control={control} render={({ field }) => <Input type="datetime-local" {...field} value={field.value || ""} />} />
            {errors.dataPagamento && <p className="text-red-500 text-sm">{errors.dataPagamento.message}</p>}
          </div>

          <div>
            <Label htmlFor="clienteId">Cliente</Label>
            <Controller
              name="clienteId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="fornecedorId">Fornecedor</Label>
            <Controller
              name="fornecedorId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione um fornecedor (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="orcamentoId">Orçamento Vinculado</Label>
            <Controller
              name="orcamentoId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione um orçamento (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {orcamentos.map(o => <SelectItem key={o.id} value={o.id}>ID: {o.id.substring(0,8)}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="pedidoCompraId">Pedido de Compra Vinculado</Label>
            <Controller
              name="pedidoCompraId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione um pedido (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {pedidosCompra.map(p => <SelectItem key={p.id} value={p.id}>ID: {p.id.substring(0,8)}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Controller name="observacoes" control={control} render={({ field }) => <Textarea {...field} value={field.value || ""} />} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Boleto (Opcional)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="nossoNumero">Nosso Número</Label>
            <Controller name="nossoNumero" control={control} render={({ field }) => <Input {...field} value={field.value || ""} />} />
            {errors.nossoNumero && <p className="text-red-500 text-sm">{errors.nossoNumero.message}</p>}
          </div>
          <div>
            <Label htmlFor="codigoBarras">Código de Barras</Label>
            <Controller name="codigoBarras" control={control} render={({ field }) => <Input {...field} value={field.value || ""} />} />
            {errors.codigoBarras && <p className="text-red-500 text-sm">{errors.codigoBarras.message}</p>}
          </div>
          <div>
            <Label htmlFor="linhaDigitavel">Linha Digitável</Label>
            <Controller name="linhaDigitavel" control={control} render={({ field }) => <Input {...field} value={field.value || ""} />} />
            {errors.linhaDigitavel && <p className="text-red-500 text-sm">{errors.linhaDigitavel.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => router.push("/financeiro/contas")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : (contaId ? "Salvar Alterações" : "Criar Conta")}
        </Button>
      </div>
    </form>
  );
}

