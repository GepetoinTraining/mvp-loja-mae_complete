# 🧾 Visita Técnica – Formulário Modular

Este módulo compõe o fluxo completo de uma visita técnica e pré-orçamento no Sorian App. Pensado para funcionar tanto no PWA (mobile) quanto no desktop, ele é altamente modular, escalável e contextual.

---

## 📁 Estrutura

```
components/
└── visita/
    ├── useVisitaFormState.ts       ← Zustand store central
    ├── VisitaResumo.tsx            ← Visão geral de ambientes + produtos
    ├── StepEndereco.tsx            ← Etapa 1: confirmação de chegada
    ├── StepAmbiente.tsx            ← Etapa 2: adicionar ambiente
    ├── StepProduto.tsx             ← Etapa 3: escolha do produto
    ├── StepCamposProduto.tsx       ← Etapa 4: render dinâmico do formulário
    ├── StepFoto.tsx                ← Etapa 5: fotos gerais
    └── produtos/
        ├── FormCortina.tsx
        ├── FormPersiana.tsx
        ├── FormPapelParede.tsx
        ├── FormRodape.tsx
        ├── FormBoiserie.tsx
        ├── FormAlmofadas.tsx
        ├── FormTrilho.tsx
        ├── FormOutros.tsx
        └── marcenaria/
            ├── FormMoveis.tsx
            └── FormGranito.tsx
```

---

## 🧠 Estado Central: `useVisitaFormState.ts`

Gerencia:
- `visitaId`, `clienteId`
- Lista de ambientes (cada um com produtos)
- Fotos gerais da visita
- Métodos: adicionar/remover ambiente, produto, fotos

---

## 🧩 Etapas do Formulário

1. **StepEndereco** – endereço do cliente + foto fachada
2. **StepAmbiente** – nome do ambiente, observações
3. **StepProduto** – escolha do tipo de produto
4. **StepCamposProduto** – renderiza o formulário específico
5. **StepFoto** – fotos extras (plantas, corredores, etc.)
6. **VisitaResumo** – tudo agrupado antes do envio final

---

## 🔄 Integração com Marcenaria
Se "móveis" for selecionado e for marcada a opção "orçar pedra da cuba", o `FormGranito` é renderizado automaticamente.

---

## ✅ Conclusão
Este sistema cobre todas as categorias de produtos orçados em visitas reais, está preparado para múltiplos ambientes, e permite futura exportação para o módulo de orçamento.

> ✨ Designado para produtividade máxima em campo e robustez administrativa.
