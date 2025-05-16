"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Terminal } from "lucide-react";

const notaFiscalFormSchema = z.object({
  orcamentoId: z.string().cuid({ message: "Orçamento é obrigatório" }),
  tipo: z.enum(["NFE", "NFCE", "NFSE"], { required_error: "Tipo é obrigatório" }),
  status: z.enum(["PENDENTE_GERACAO", "GERADA", "ENVIADA_SEFAZ", "AUTORIZADA", "REJEITADA", "CANCELADA", "ERRO"]).default("PENDENTE_GERACAO"),
  observacoes: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  serie: z.string().optional().nullable(),
  chaveAcesso: z.string().optional().nullable(),
  xml: z.string().optional().nullable(),
  pdfUrl: z.string().url().optional().nullable(),
  dataAutorizacao: z.string().optional().nullable(),
  protocolo: z.string().optional().nullable(),
  motivoRejeicao: z.string().optional().nullable(),
});

type NotaFiscalFormData = z.infer<typeof notaFiscalFormSchema>;

interface Orcamento {
  id: string;
  cliente: { nome: string };
  status: string;
}

export function NotaFiscalForm() {
  const router = useRouter();
  const params = useParams();
  const notaFiscalId = params?.id as string | undefined;

  const [loading, setLoading] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [currentNotaFiscal, setCurrentNotaFiscal] = useState<any>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState("");
  const [ambienteSefaz, setAmbienteSefaz] = useState("2"); // 2 for Homologação, 1 for Produção

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NotaFiscalFormData>({
    resolver: zodResolver(notaFiscalFormSchema),
    defaultValues: {
      orcamentoId: "",
      tipo: "NFE",
      status: "PENDENTE_GERACAO",
      observacoes: "",
      numero: "",
      serie: "",
      chaveAcesso: "",
      xml: "",
      pdfUrl: "",
      dataAutorizacao: null,
      protocolo: "",
      motivoRejeicao: "",
    },
  });

  const watchedStatus = watch("status");

  useEffect(() => {
    async function fetchOrcamentos() {
      try {
        const response = await fetch("/api/orcamentos?status=FECHADO&status=INSTALACAO_CONCLUIDA");
        if (!response.ok) throw new Error("Failed to fetch budgets");
        const data = await response.json();
        setOrcamentos(data.filter((o: Orcamento) => o.status === "FECHADO" || o.status === "INSTALACAO_CONCLUIDA"));
      } catch (error) {
        console.error("Error fetching budgets:", error);
        toast.error("Erro ao carregar orçamentos.");
      }
    }
    if (!notaFiscalId) {
        fetchOrcamentos();
    }
  }, [notaFiscalId]);

  useEffect(() => {
    if (notaFiscalId) {
      setLoading(true);
      async function fetchNotaFiscalData() {
        try {
          const response = await fetch(`/api/notas-fiscais/${notaFiscalId}`);
          if (!response.ok) throw new Error("Failed to fetch nota fiscal data");
          const data = await response.json();
          setCurrentNotaFiscal(data);
          reset({
            ...data,
            orcamentoId: data.orcamentoId,
            dataAutorizacao: data.dataAutorizacao ? new Date(data.dataAutorizacao).toISOString().substring(0, 16) : null,
          });
        } catch (error) {
          console.error("Error fetching nota fiscal data:", error);
          toast.error("Erro ao carregar dados da nota fiscal.");
          router.push("/financeiro/notas-fiscais");
        } finally {
          setLoading(false);
        }
      }
      fetchNotaFiscalData();
    }
  }, [notaFiscalId, reset, router]);

  const onSubmit = async (data: NotaFiscalFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        dataAutorizacao: data.dataAutorizacao ? new Date(data.dataAutorizacao).toISOString() : null,
      };
      const response = await fetch(
        notaFiscalId ? `/api/notas-fiscais/${notaFiscalId}` : "/api/notas-fiscais",
        {
          method: notaFiscalId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save nota fiscal");
      }
      const savedData = await response.json();
      toast.success(`Nota Fiscal ${notaFiscalId ? "atualizada" : "criada"} com sucesso!`);
      if (!notaFiscalId) {
        router.push(`/financeiro/notas-fiscais/editar/${savedData.id}`);
      } else {
        setCurrentNotaFiscal(savedData);
        reset(savedData);
        router.refresh();
      }
    } catch (error: any) {
      console.error("Error saving nota fiscal:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCertificateFile(event.target.files[0]);
    }
  };

  const handleTransmitToSefaz = async () => {
    if (!certificateFile || !certificatePassword) {
      toast.error("Por favor, selecione o arquivo do certificado A1 (.pfx) e informe a senha.");
      return;
    }
    if (!notaFiscalId) {
      toast.error("Salve a Nota Fiscal antes de transmitir.");
      return;
    }

    setTransmitting(true);
    toast.info("Iniciando transmissão para SEFAZ...");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(certificateFile);
      reader.onload = async (event) => {
        const base64Certificate = (event.target?.result as string)?.split(",")[1];
        if (!base64Certificate) {
          toast.error("Erro ao ler o arquivo do certificado.");
          setTransmitting(false);
          return;
        }

        const payload = {
          certificate_base64: base64Certificate,
          certificate_password: certificatePassword,
          ambiente: ambienteSefaz,
        };

        const response = await fetch(`/api/notas-fiscais/${notaFiscalId}/transmitir`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(`Erro na transmissão: ${result.error || response.statusText}`, {
            description: JSON.stringify(result.details || result.sefaz_response || result),
            duration: 10000,
          });
          if (result.updated_nota_fiscal) {
            setCurrentNotaFiscal(result.updated_nota_fiscal);
            reset(result.updated_nota_fiscal);
          }
        } else {
          toast.success("Processamento SEFAZ concluído!", {
            description: `Status: ${result.sefaz_response?.status_sefaz}. Motivo: ${result.sefaz_response?.motivo_sefaz}`,
            duration: 10000,
          });
          setCurrentNotaFiscal(result.updated_nota_fiscal);
          reset(result.updated_nota_fiscal);
          // Optionally download XML or PDF if available
          if (result.sefaz_response?.xml_autorizado) {
            // Create a link and click it to download XML
            const blob = new Blob([result.sefaz_response.xml_autorizado], { type: "application/xml" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `NFe_${result.updated_nota_fiscal.chaveAcesso || notaFiscalId}.xml`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
          if (result.sefaz_response?.danfe_pdf_base64) {
            const blob = new Blob([Uint8Array.from(atob(result.sefaz_response.danfe_pdf_base64), c => c.charCodeAt(0))], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `DANFE_NFe_${result.updated_nota_fiscal.chaveAcesso || notaFiscalId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
        router.refresh();
        setTransmitting(false);
      };
      reader.onerror = () => {
        toast.error("Erro ao processar o arquivo do certificado.");
        setTransmitting(false);
      };
    } catch (error: any) {
      toast.error(`Erro inesperado: ${error.message}`);
      setTransmitting(false);
    }
  };

  if (notaFiscalId && loading && !currentNotaFiscal) return <p>Carregando dados da nota fiscal...</p>;

  const isReadOnly = notaFiscalId && currentNotaFiscal && 
                     (currentNotaFiscal.status === "AUTORIZADA" || 
                      currentNotaFiscal.status === "CANCELADA" || 
                      currentNotaFiscal.status === "ENVIADA_SEFAZ");
  
  const canTransmit = notaFiscalId && currentNotaFiscal && 
                      (currentNotaFiscal.status === "PENDENTE_GERACAO" || 
                       currentNotaFiscal.status === "GERADA" || 
                       currentNotaFiscal.status === "ERRO" || 
                       currentNotaFiscal.status === "REJEITADA");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{notaFiscalId ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}</CardTitle>
          {currentNotaFiscal && <CardDescription>ID: {currentNotaFiscal.id} {currentNotaFiscal.chaveAcesso && `| Chave: ${currentNotaFiscal.chaveAcesso}`}</CardDescription>}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fields from previous implementation... */}
          <div>
            <Label htmlFor="orcamentoId">Orçamento</Label>
            <Controller
              name="orcamentoId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={!!notaFiscalId || isReadOnly}>
                  <SelectTrigger><SelectValue placeholder="Selecione um orçamento" /></SelectTrigger>
                  <SelectContent>
                    {orcamentos.map((orc) => (
                      <SelectItem key={orc.id} value={orc.id}>
                        ID: {orc.id.substring(0,8)} - Cliente: {orc.cliente?.nome || "N/A"} (Status: {orc.status})
                      </SelectItem>
                    ))}
                    {notaFiscalId && currentNotaFiscal?.orcamento && 
                        !orcamentos.find(o => o.id === currentNotaFiscal.orcamento.id) && (
                        <SelectItem value={currentNotaFiscal.orcamento.id} key={currentNotaFiscal.orcamento.id}>
                            ID: {currentNotaFiscal.orcamento.id.substring(0,8)} - Cliente: {currentNotaFiscal.orcamento.cliente?.nome || "N/A"} (Status: {currentNotaFiscal.orcamento.status})
                        </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.orcamentoId && <p className="text-red-500 text-sm">{errors.orcamentoId.message}</p>}
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Nota Fiscal</Label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFE">NFe (Produtos/Serviços)</SelectItem>
                    <SelectItem value="NFCE">NFCe (Consumidor)</SelectItem>
                    <SelectItem value="NFSE">NFSe (Serviço Municipal)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo && <p className="text-red-500 text-sm">{errors.tipo.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(value) => field.onChange(value)} value={field.value} 
                        disabled={isReadOnly && field.value === "AUTORIZADA" || field.value === "CANCELADA" || (currentNotaFiscal?.status === "AUTORIZADA" && field.value !== "CANCELADA")}>
                  <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE_GERACAO">Pendente Geração</SelectItem>
                    <SelectItem value="GERADA">Gerada (Aguardando Envio)</SelectItem>
                    {currentNotaFiscal?.status === "AUTORIZADA" && <SelectItem value="CANCELADA">Cancelar NF-e</SelectItem>}
                    {/* Other statuses are mostly system-controlled after transmission */}
                    {["ENVIADA_SEFAZ", "AUTORIZADA", "REJEITADA", "ERRO"].includes(field.value) && 
                        !["PENDENTE_GERACAO", "GERADA"].includes(field.value) && 
                        (currentNotaFiscal?.status !== "AUTORIZADA" || field.value !== "CANCELADA") &&
                        <SelectItem value={field.value} disabled>{field.value.replace("_", " ")}</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Controller name="observacoes" control={control} render={({ field }) => <Textarea {...field} value={field.value || ""} readOnly={isReadOnly && watchedStatus !== "CANCELADA"} />} />
          </div>
        </CardContent>
      </Card>

      {(notaFiscalId && currentNotaFiscal && (watchedStatus !== "PENDENTE_GERACAO" && watchedStatus !== "GERADA")) && (
        <Card>
          <CardHeader>
            <CardTitle>Dados da Nota Fiscal (Pós-Autorização/SEFAZ)</CardTitle>
            <CardDescription>Estes campos são preenchidos após comunicação com a SEFAZ.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div><Label>Número NF:</Label><Input value={currentNotaFiscal.numero || ""} readOnly /></div>
            <div><Label>Série:</Label><Input value={currentNotaFiscal.serie || ""} readOnly /></div>
            <div><Label>Chave de Acesso:</Label><Input value={currentNotaFiscal.chaveAcesso || ""} readOnly /></div>
            <div><Label>Data de Autorização:</Label><Input value={currentNotaFiscal.dataAutorizacao ? new Date(currentNotaFiscal.dataAutorizacao).toLocaleString("pt-BR") : ""} readOnly /></div>
            <div><Label>Protocolo:</Label><Input value={currentNotaFiscal.protocolo || ""} readOnly /></div>
            <div><Label>URL PDF (DANFE):</Label><Input value={currentNotaFiscal.pdfUrl || ""} readOnly /></div>
            <div className="md:col-span-full">
              <Label>Conteúdo XML:</Label>
              <Textarea value={currentNotaFiscal.xml || ""} rows={5} readOnly placeholder="Conteúdo XML da nota fiscal..." />
            </div>
            {(currentNotaFiscal.status === "REJEITADA" || currentNotaFiscal.status === "ERRO") && (
                <div className="md:col-span-full">
                    <Label>Motivo da Rejeição/Erro:</Label>
                    <Textarea value={currentNotaFiscal.motivoRejeicao || ""} readOnly />
                </div>
            )}
          </CardContent>
        </Card>
      )}

      {canTransmit && (
        <Card>
          <CardHeader>
            <CardTitle>Transmitir Nota Fiscal para SEFAZ</CardTitle>
            <CardDescription>Forneça o certificado A1 e a senha para assinar e transmitir a NF-e.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="certificateFile">Certificado Digital A1 (.pfx)</Label>
              <Input id="certificateFile" type="file" accept=".pfx" onChange={handleFileChange} />
            </div>
            <div>
              <Label htmlFor="certificatePassword">Senha do Certificado</Label>
              <Input id="certificatePassword" type="password" value={certificatePassword} onChange={(e) => setCertificatePassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ambienteSefaz">Ambiente SEFAZ</Label>
              <Select value={ambienteSefaz} onValueChange={setAmbienteSefaz}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Homologação (Teste)</SelectItem>
                  <SelectItem value="1">Produção (Real)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={handleTransmitToSefaz} disabled={transmitting || !certificateFile || !certificatePassword}>
              {transmitting ? "Transmitindo..." : "Transmitir para SEFAZ"}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentNotaFiscal?.xml && 
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>XML da Nota Fiscal</AlertTitle>
          <AlertDescription className="mt-2">
            <Button variant="outline" size="sm" onClick={() => {
              const blob = new Blob([currentNotaFiscal.xml], { type: "application/xml" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `NFe_${currentNotaFiscal.chaveAcesso || notaFiscalId}.xml`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>Baixar XML</Button>
          </AlertDescription>
        </Alert>
      }
      {/* Placeholder for DANFE PDF download if available from SEFAZ service response and stored */}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => router.push("/financeiro/notas-fiscais")}>
          Cancelar/Voltar
        </Button>
        {(!isReadOnly || watchedStatus === "CANCELADA") && (
            <Button type="submit" disabled={loading || transmitting}>
            {loading ? "Salvando..." : (notaFiscalId ? "Salvar Alterações Locais" : "Criar Nota Fiscal")}
            </Button>
        )}
      </div>
    </form>
  );
}

