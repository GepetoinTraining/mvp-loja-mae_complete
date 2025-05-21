// src/components/pedidos-compra/PedidoCompraForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle } from "lucide-react";
import { Fornecedor, Orcamento, PedidoCompra, ItemPedidoCompra } from "@prisma/client"; // Assuming Prisma client types

const itemPedidoCompraFormSchema = z.object({
  // produtoId: z.string().optional(), // If linking to a generic product catalog
  descricao: z.string().min(1, "Descrição do item é obrigatória"),
  quantidade: z.coerce.number().min(0.01, "Quantidade deve ser maior que zero"),
  unidade: z.string().min(1, "Unidade é obrigatória (ex: m, m², un)"),
  precoUnitario: z.coerce.number().min(0, "Preço unitário não pode ser negativo"),
});

const pedidoCompraFormSchema = z.object({
  fornecedorId: z.string().cuid("ID de fornecedor inválido"),
  orcamentoId: z.string().cuid("ID de orçamento inválido").optional().nullable(),
  dataNecessidade: z.string().optional().nullable(), // Will be converted to Date before sending
  observacoes: z.string().optional(),
  itens: z.array(itemPedidoCompraFormSchema).min(1, "Adicione pelo menos um item ao pedido"),
});

type PedidoCompraFormData = z.infer<typeof pedidoCompraFormSchema>;

interface PedidoCompraFormProps {
  pedido?: PedidoCompra & { itens: ItemPedidoCompra[] } | null; // For edit mode
}

export default function PedidoCompraForm({ pedido: initialPedido }: PedidoCompraFormProps) {
  const router = useRouter();
  const params = useParams();
  const pedidoId = params?.id as string | undefined; // For edit mode

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]); // For linking to an orcamento

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PedidoCompraFormData>({
    resolver: zodResolver(pedidoCompraFormSchema),
    defaultValues: initialPedido
      ? {
          ...initialPedido,
          dataNecessidade: initialPedido.dataNecessidade ? new Date(initialPedido.dataNecessidade).toISOString().split("T")[0] : "",
          orcamentoId: initialPedido.orcamentoId || "", // Ensure orcamentoId is a string or undefined
        }
      : {
          fornecedorId: "",
          orcamentoId: "",
          dataNecessidade: "",
          observacoes: "",
          itens: [{ descricao: "", quantidade: 1, unidade: "un", precoUnitario: 0 }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fornecedoresRes, orcamentosRes] = await Promise.all([
          fetch("/api/fornecedores"),
          fetch("/api/orcamentos"), // Fetch orcamentos to link
        ]);
        if (!fornecedoresRes.ok) throw new Error("Failed to fetch fornecedores");
        if (!orcamentosRes.ok) throw new Error("Failed to fetch orçamentos");
        
        const fornecedoresData = await fornecedoresRes.json();
        const orcamentosData = await orcamentosRes.json();
        
        setFornecedores(fornecedoresData);
        setOrcamentos(orcamentosData);

      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Falha ao carregar dados iniciais.");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (pedidoId && !initialPedido) {
      const fetchPedido = async () => {
        try {
          const response = await fetch(`/api/pedidos-compra/${pedidoId}`);
          if (!response.ok) throw new Error("Pedido de compra não encontrado");
          const data = await response.json();
          reset({
            ...data,
            dataNecessidade: data.dataNecessidade ? new Date(data.dataNecessidade).toISOString().split("T")[0] : "",
            orcamentoId: data.orcamentoId || "",
          });
        } catch (err) {
          console.error("Error fetching pedido de compra:", err);
          setError("Falha ao carregar dados do pedido.");
        }
      };
      fetchPedido();
    }
  }, [pedidoId, reset, initialPedido]);

  const onSubmit = async (data: PedidoCompraFormData) => {
    setIsSubmitting(true);
    setError(null);
    const method = pedidoId ? "PUT" : "POST";
    const url = pedidoId ? `/api/pedidos-compra/${pedidoId}` : "/api/pedidos-compra";

    const payload = {
        ...data,
        dataNecessidade: data.dataNecessidade ? new Date(data.dataNecessidade).toISOString() : null,
        orcamentoId: data.orcamentoId === "" ? null : data.orcamentoId, // Handle empty string for optional orcamentoId
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao ${pedidoId ? "atualizar" : "criar"} pedido`);
      }

      alert(`Pedido de compra ${pedidoId ? "atualizado" : "criado"} com sucesso!`);
      router.push("/pedidos-compra");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      console.error(`Error ${pedidoId ? "updating" : "creating"} pedido:`, err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{pedidoId ? "Editar" : "Novo"} Pedido de Compra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="fornecedorId" className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
            <Controller
              name="fornecedorId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.fornecedorId && <p className="text-sm text-red-600 mt-1">{errors.fornecedorId.message}</p>}
          </div>

          <div>
            <label htmlFor="orcamentoId" className="block text-sm font-medium text-gray-700 mb-1">Orçamento Vinculado (Opcional)</label>
            <Controller
              name="orcamentoId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um orçamento (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {orcamentos.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        ID: {o.id.substring(0,8)}... (Cliente: {o.clienteId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.orcamentoId && <p className="text-sm text-red-600 mt-1">{errors.orcamentoId.message}</p>}
          </div>

          <div>
            <label htmlFor="dataNecessidade" className="block text-sm font-medium text-gray-700 mb-1">Data de Necessidade</label>
            <Input id="dataNecessidade" type="date" {...register("dataNecessidade")} />
            {errors.dataNecessidade && <p className="text-sm text-red-600 mt-1">{errors.dataNecessidade.message}</p>}
          </div>

          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <Textarea id="observacoes" {...register("observacoes")} placeholder="Detalhes adicionais do pedido" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Itens do Pedido</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ descricao: "", quantidade: 1, unidade: "un", precoUnitario: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
              <h3 className="text-lg font-semibold">Item {index + 1}</h3>
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div>
                <label htmlFor={`itens.${index}.descricao`} className="block text-sm font-medium text-gray-700 mb-1">Descrição do Item</label>
                <Input id={`itens.${index}.descricao`} {...register(`itens.${index}.descricao`)} placeholder="Ex: Tecido Linho Bege" />
                {errors.itens?.[index]?.descricao && <p className="text-sm text-red-600 mt-1">{errors.itens[index]?.descricao?.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor={`itens.${index}.quantidade`} className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                  <Input id={`itens.${index}.quantidade`} type="number" step="0.01" {...register(`itens.${index}.quantidade`)} placeholder="0.00" />
                  {errors.itens?.[index]?.quantidade && <p className="text-sm text-red-600 mt-1">{errors.itens[index]?.quantidade?.message}</p>}
                </div>
                <div>
                  <label htmlFor={`itens.${index}.unidade`} className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <Input id={`itens.${index}.unidade`} {...register(`itens.${index}.unidade`)} placeholder="m, m², un, peça" />
                  {errors.itens?.[index]?.unidade && <p className="text-sm text-red-600 mt-1">{errors.itens[index]?.unidade?.message}</p>}
                </div>
                <div>
                  <label htmlFor={`itens.${index}.precoUnitario`} className="block text-sm font-medium text-gray-700 mb-1">Preço Unitário (R$)</label>
                  <Input id={`itens.${index}.precoUnitario`} type="number" step="0.01" {...register(`itens.${index}.precoUnitario`)} placeholder="0.00" />
                  {errors.itens?.[index]?.precoUnitario && <p className="text-sm text-red-600 mt-1">{errors.itens[index]?.precoUnitario?.message}</p>}
                </div>
              </div>
            </div>
          ))}
          {errors.itens && typeof errors.itens === "object" && "message" in errors.itens && (
             <p className="text-sm text-red-600 mt-1">{errors.itens.message}</p>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-red-500 text-sm">Erro: {error}</p>}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => router.push("/pedidos-compra")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : (pedidoId ? "Salvar Alterações" : "Criar Pedido")}
        </Button>
      </div>
    </form>
  );
}

