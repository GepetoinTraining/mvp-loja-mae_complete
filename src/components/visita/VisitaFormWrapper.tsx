"use client";

import React from "react";
import { useEffect, useState } from "react";
import { StepEndereco } from "./steps/StepEndereco";
import { StepAmbiente } from "./steps/StepAmbiente";
import { useVisitaFormState } from "./useVisitaFormState";
import { StepCamposProduto } from "./steps/StepCamposProduto";
import { StepProduto } from "./steps/StepProduto";
import { StepFoto } from "./steps/StepFoto";
import { VisitaResumo } from "./VisitaResumo";

export function VisitaFormWrapper({ visita }: { visita: any }) {
  const [step, setStep] = useState(1);
  const { setVisitaInfo } = useVisitaFormState();

  useEffect(() => {
    if (visita?.clienteId) {
      setVisitaInfo(visita.id ?? null, visita.clienteId);
    }
  }, [visita?.id, visita?.clienteId, setVisitaInfo]);

  const next = () => setStep((prev) => prev + 1);
  const back = () => setStep((prev) => Math.max(0, prev - 1));

  const steps = [
    <StepEndereco visita={visita} onNext={next} />,
    <StepAmbiente onBack={back} onNext={next} />,
    <StepProduto onBack={back} onNext={next} />,
    <StepCamposProduto produto={{ tipo: "cortina" }} onConfirm={next} />,
    <StepFoto onNext={next} />,
    <VisitaResumo />
  ];
  
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-primary">Pré-Orçamento: Visita</h1>
      <p className="text-sm text-muted-foreground">Cliente: {visita.cliente?.nome}</p>
      {steps[step - 1] /* porque você começou em 1 */}
    </div>
  );
