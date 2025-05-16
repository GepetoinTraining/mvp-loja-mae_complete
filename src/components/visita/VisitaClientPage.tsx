"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { VisitaFormWrapper } from "@/components/visita/VisitaFormWrapper";

type Props = {
  clienteId: string;
};

export default function VisitaClientPage({ clienteId }: Props) {
  const [visita, setVisita] = useState<any>(null);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    const criarVisita = async () => {
      try {
        const res = await fetch("/api/visitas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteId,
            vendedorId: user?.id,
            dataHora: new Date().toISOString(),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao criar visita");

        const clienteRes = await fetch(`/api/clientes/${clienteId}`);
        const cliente = await clienteRes.json();

        setVisita({ ...data, cliente });
      } catch (err) {
        alert("Erro ao iniciar visita");
        router.push("/visita");
      }
    };

    if (user?.id) {
      criarVisita();
    }
  }, [clienteId, user]);

  if (!visita) return <p className="p-6">Carregando visita...</p>;

  return <VisitaFormWrapper visita={visita} />;
}
