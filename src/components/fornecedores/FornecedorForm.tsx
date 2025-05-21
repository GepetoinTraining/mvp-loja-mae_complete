// src/components/fornecedores/FornecedorForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fornecedor } from "@prisma/client"; // Assuming Prisma client type

const fornecedorFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorFormSchema>;

interface FornecedorFormProps {
  fornecedor?: Fornecedor | null;
}

export default function FornecedorForm({ fornecedor: initialFornecedor }: FornecedorFormProps) {
  const router = useRouter();
  const params = useParams();
  const fornecedorId = params?.id as string | undefined; // For edit mode

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fornecedor, setFornecedor] = useState<Fornecedor | null | undefined>(initialFornecedor);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorFormSchema),
    defaultValues: initialFornecedor || {
      nome: "",
      cnpj: "",
      telefone: "",
      email: "",
      endereco: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (fornecedorId && !initialFornecedor) {
      const fetchFornecedor = async () => {
        try {
          const response = await fetch(`/api/fornecedores/${fornecedorId}`);
          if (!response.ok) throw new Error("Fornecedor não encontrado");
          const data = await response.json();
          setFornecedor(data);
          reset(data); // Populate form with fetched data
        } catch (err) {
          console.error("Error fetching fornecedor:", err);
          setError("Falha ao carregar dados do fornecedor.");
        }
      };
      fetchFornecedor();
    }
  }, [fornecedorId, reset, initialFornecedor]);

  useEffect(() => {
    if (initialFornecedor) {
        reset(initialFornecedor);
    }
  }, [initialFornecedor, reset]);

  const onSubmit = async (data: FornecedorFormData) => {
    setIsSubmitting(true);
    setError(null);
    const method = fornecedorId ? "PUT" : "POST";
    const url = fornecedorId ? `/api/fornecedores/${fornecedorId}` : "/api/fornecedores";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao ${fornecedorId ? "atualizar" : "criar"} fornecedor`);
      }

      alert(`Fornecedor ${fornecedorId ? "atualizado" : "criado"} com sucesso!`);
      router.push("/fornecedores");
      router.refresh(); // Refresh data on the list page
    } catch (err: any) {
      setError(err.message);
      console.error(`Error ${fornecedorId ? "updating" : "creating"} fornecedor:`, err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{fornecedorId ? "Editar" : "Novo"} Fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome do Fornecedor</label>
            <Input id="nome" {...register("nome")} placeholder="Nome Fantasia ou Razão Social" />
            {errors.nome && <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <Input id="cnpj" {...register("cnpj")} placeholder="00.000.000/0000-00" />
              {errors.cnpj && <p className="text-sm text-red-600 mt-1">{errors.cnpj.message}</p>}
            </div>
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <Input id="telefone" {...register("telefone")} placeholder="(00) 00000-0000" />
              {errors.telefone && <p className="text-sm text-red-600 mt-1">{errors.telefone.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input id="email" type="email" {...register("email")} placeholder="contato@fornecedor.com" />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <Textarea id="endereco" {...register("endereco")} placeholder="Rua, Número, Bairro, Cidade, Estado, CEP" />
            {errors.endereco && <p className="text-sm text-red-600 mt-1">{errors.endereco.message}</p>}
          </div>

          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <Textarea id="observacoes" {...register("observacoes")} placeholder="Condições de pagamento, contatos, etc." />
            {errors.observacoes && <p className="text-sm text-red-600 mt-1">{errors.observacoes.message}</p>}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-red-500 text-sm">Erro: {error}</p>}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => router.push("/fornecedores")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : (fornecedorId ? "Salvar Alterações" : "Criar Fornecedor")}
        </Button>
      </div>
    </form>
  );
}

