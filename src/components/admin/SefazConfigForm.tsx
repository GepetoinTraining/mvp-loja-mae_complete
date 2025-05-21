"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const sefazConfigFormSchema = z.object({
  companyCnpj: z.string().min(14, "CNPJ é obrigatório e deve ter 14 ou 18 caracteres").max(18, "CNPJ é obrigatório e deve ter 14 ou 18 caracteres"),
  certificatePassword: z.string().min(1, "Senha do certificado é obrigatória"),
  certificateFile: z.instanceof(FileList).refine(files => files?.length === 1, "Arquivo do certificado (.pfx) é obrigatório.").or(z.instanceof(FileList).refine(files => files?.length === 0)).optional(), // Optional if updating other fields
  lastUsedNFeNumber: z.coerce.number().int().positive("Último número da NF-e deve ser um inteiro positivo").optional(),
  currentNFeSeries: z.coerce.number().int().positive("Série da NF-e deve ser um inteiro positivo").optional(),
});

type SefazConfigFormData = z.infer<typeof sefazConfigFormSchema>;

interface SefazConfigData {
  id?: string;
  companyCnpj?: string;
  certificatePath?: string; 
  certificateFileName?: string;
  certificateExpiresAt?: string;
  emitenteNomeRazao?: string;
  isActive?: boolean;
  lastUsedNFeNumber?: number;
  currentNFeSeries?: number;
}

export function SefazConfigForm() {
  const [loading, setLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<SefazConfigData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SefazConfigFormData>({
    resolver: zodResolver(sefazConfigFormSchema),
  });

  useEffect(() => {
    async function fetchCurrentConfig() {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/sefaz-config");
        if (response.ok) {
          const data = await response.json();
          setCurrentConfig(data);
          // Reset form with fetched data
          setValue("companyCnpj", data.companyCnpj || "");
          setValue("lastUsedNFeNumber", data.lastUsedNFeNumber || undefined);
          setValue("currentNFeSeries", data.currentNFeSeries || undefined);
          // Certificate file and password are not pre-filled for security/UX reasons
        } else if (response.status !== 404) { 
          const errorData = await response.json();
          toast.error("Erro ao carregar configuração SEFAZ existente", { description: errorData.error });
        }
      } catch (error: any) {
        toast.error("Erro de rede ao carregar configuração SEFAZ", { description: error.message });
      } finally {
        setLoading(false);
      }
    }
    fetchCurrentConfig();
  }, [reset, setValue]);

  const onSubmit = async (data: SefazConfigFormData) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("companyCnpj", data.companyCnpj.replace(/\D/g, "")); 
    formData.append("certificatePassword", data.certificatePassword);
    if (data.certificateFile && data.certificateFile.length > 0) {
      formData.append("certificateFile", data.certificateFile[0]);
    }
    if (data.lastUsedNFeNumber !== undefined) {
        formData.append("lastUsedNFeNumber", data.lastUsedNFeNumber.toString());
    }
    if (data.currentNFeSeries !== undefined) {
        formData.append("currentNFeSeries", data.currentNFeSeries.toString());
    }

    try {
      const response = await fetch("/api/admin/sefaz-config", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao salvar configuração SEFAZ");
      }
      toast.success("Configuração SEFAZ salva com sucesso!");
      setCurrentConfig(result.config); 
      setValue("companyCnpj", result.config.companyCnpj || "");
      setValue("lastUsedNFeNumber", result.config.lastUsedNFeNumber || undefined);
      setValue("currentNFeSeries", result.config.currentNFeSeries || undefined);
      setValue("certificatePassword", ""); // Clear password field
      setValue("certificateFile", new DataTransfer().files); // Clear file input
    } catch (error: any) {
      toast.error("Erro ao salvar configuração SEFAZ", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configuração SEFAZ</CardTitle>
        <CardDescription>
          Configure o certificado A1, CNPJ, e a numeração inicial para emissão de Notas Fiscais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentConfig && currentConfig.id && (
          <Alert className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Configuração Ativa</AlertTitle>
            <AlertDescription>
              <p>CNPJ: {currentConfig.companyCnpj}</p>
              <p>Certificado: {currentConfig.certificateFileName || "N/A"} (Expira em: {currentConfig.certificateExpiresAt ? new Date(currentConfig.certificateExpiresAt).toLocaleDateString("pt-BR") : "N/A"})</p>
              <p>Emitente: {currentConfig.emitenteNomeRazao || "(Aguardando busca/informação)"}</p>
              <p>Última NF-e emitida: {currentConfig.lastUsedNFeNumber || "Não configurado"}</p>
              <p>Série NF-e atual: {currentConfig.currentNFeSeries || "Não configurado"}</p>
              <p className="text-sm text-muted-foreground mt-2">Para atualizar, preencha os campos abaixo. O arquivo do certificado só precisa ser reenviado se for um novo certificado.</p>
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="companyCnpj">CNPJ da Empresa (Emitente)</Label>
            <Input id="companyCnpj" {...register("companyCnpj")} placeholder="00.000.000/0001-00" />
            {errors.companyCnpj && <p className="text-red-500 text-sm mt-1">{errors.companyCnpj.message}</p>}
          </div>

          <div>
            <Label htmlFor="certificateFile">Arquivo do Certificado Digital A1 (.pfx) - (Opcional se não estiver atualizando)</Label>
            <Input id="certificateFile" type="file" {...register("certificateFile")} accept=".pfx" />
            {errors.certificateFile && <p className="text-red-500 text-sm mt-1">{errors.certificateFile.message}</p>}
          </div>

          <div>
            <Label htmlFor="certificatePassword">Senha do Certificado Digital</Label>
            <Input id="certificatePassword" type="password" {...register("certificatePassword")} />
            {errors.certificatePassword && <p className="text-red-500 text-sm mt-1">{errors.certificatePassword.message}</p>}
          </div>

          <div>
            <Label htmlFor="lastUsedNFeNumber">Último Número de NF-e Utilizado</Label>
            <Input id="lastUsedNFeNumber" type="number" {...register("lastUsedNFeNumber")} placeholder="Ex: 12345"/>
            {errors.lastUsedNFeNumber && <p className="text-red-500 text-sm mt-1">{errors.lastUsedNFeNumber.message}</p>}
          </div>

          <div>
            <Label htmlFor="currentNFeSeries">Série da NF-e Atual</Label>
            <Input id="currentNFeSeries" type="number" {...register("currentNFeSeries")} placeholder="Ex: 1"/>
            {errors.currentNFeSeries && <p className="text-red-500 text-sm mt-1">{errors.currentNFeSeries.message}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Salvando..." : (currentConfig && currentConfig.id ? "Atualizar Configuração" : "Salvar Configuração")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

