// src/app/(protected)/pedidos-compra/novo/page.tsx
"use client";

import PedidoCompraForm from "@/components/pedidos-compra/PedidoCompraForm";

export default function NovoPedidoCompraPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Novo Pedido de Compra</h1>
      <PedidoCompraForm />
    </div>
  );
}

