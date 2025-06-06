"use client";

import { FormCortina } from "./produto/FormCortina";
import { FormPersiana } from "./produto/FormPersiana";
import { FormPapelParede } from "./produto/FormPapelParede";
import { FormRodape } from "./produto/FormRodape";
import { FormBoiserie } from "./produto/FormBoiserie";
import { FormMoveis } from "./produto/marcenaria/FormMoveis";
import { FormGranito } from "./produto/marcenaria/FormGranito";
import { FormAlmofadas } from "./produto/FormAlmofadas";
import { FormTrilho } from "./produto/FormTrilho";
import { FormOutros } from "./produto/FormOutros";
import { useVisitaFormState } from "../useVisitaFormState";
import { useState } from "react";

export function StepCamposProduto({ onConfirm }: { onConfirm: () => void }) {
  const [granitoConfirmado, setGranitoConfirmado] = useState(false);
  const [granitoData, setGranitoData] = useState(null);

  const { ambientes, updateAmbiente } = useVisitaFormState();
  const ambienteIndex = ambientes.length - 1;
  const produto = ambientes[ambienteIndex]?.produtos.slice(-1)[0];

  if (!produto?.tipo) return <p className="text-muted-foreground">Produto não selecionado.</p>;

  const salvar = (dados: any) => {
    const atual = ambientes[ambienteIndex];
    const atualizados = [...atual.produtos];
    atualizados[atualizados.length - 1] = { ...produto, ...dados };
    updateAmbiente(ambienteIndex, { ...atual, produtos: atualizados });
    onConfirm();
  };

  if (produto.tipo === "cortina") return <FormCortina onConfirm={salvar} />;
  if (produto.tipo === "persiana") return <FormPersiana onConfirm={salvar} />;
  if (produto.tipo === "papel_parede") return <FormPapelParede onConfirm={salvar} />;
  if (produto.tipo === "rodape") return <FormRodape onConfirm={salvar} />;
  if (produto.tipo === "boiserie") return <FormBoiserie onConfirm={salvar} />;
  if (produto.tipo === "almofadas") return <FormAlmofadas onConfirm={salvar} />;
  if (produto.tipo === "trilho") return <FormTrilho onConfirm={salvar} />;
  if (produto.tipo === "outros") return <FormOutros onConfirm={salvar} />;

  if (produto.tipo === "moveis") {
    return (
      <FormMoveis
        onConfirm={(data) => {
          if (data.orcarPedra) {
            setGranitoData(data);
          } else {
            salvar(data);
          }
        }}
      />
    );
  }

  if (granitoData && !granitoConfirmado) {
    return (
      <FormGranito
        onConfirm={(granito) => {
          setGranitoConfirmado(true);
          salvar({ ...granitoData, granito });
        }}
      />
    );
  }

  return <p className="text-muted-foreground">Produto não suportado: {produto.tipo}</p>;
}
