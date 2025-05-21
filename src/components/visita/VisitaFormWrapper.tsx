"use client";

import React, { useEffect, useState } from "react";
import { StepEndereco } from "@/components/visita/step/StepEndereco";
import { StepAmbiente } from "@/components/visita/step/StepAmbiente";
import { StepProduto } from "@/components/visita/step/StepProduto";
import { StepCamposProduto } from "@/components/visita/step/StepCamposProduto";
import { StepFoto } from "@/components/visita/step/StepFoto";
import { VisitaResumo } from "./VisitaResumo";
import { useVisitaFormState } from "./useVisitaFormState";

export function VisitaFormWrapper({ visita }: { visita: any }) {
  const [step, setStep] = useState(1);
  const { setVisitaInfo } = useVisitaFormState();

  useEffect(() => {
    if (visita?.clienteId) {
      setVisitaInfo(visita.id ?? null, visita.clienteId);
    }
  }, [visita?.id, visita?.clienteId, setVisitaInfo]);

  const next = () => setStep((prev) => prev + 1);
  const back = () => setStep((prev) => Math.max(1, prev - 1)); // step starts at 1

  const steps = [
    <StepEndereco visita={visita} onNext={next} />,
    <StepAmbiente onBack={back} onNext={next} />,
    <StepProduto onBack={back} onNext={next} />,
    <StepCamposProduto onConfirm={next} />,
    <StepFoto onNext={next} />,
    <VisitaResumo />
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-primary">Pré-Orçamento: Visita</h1>
      <p className="text-sm text-muted-foreground">Cliente: {visita.cliente?.nome}</p>
      {steps[step - 1] /* because step starts at 1 */}
    </div>
  );
}
