import { VendasDashboard } from "@/components/vendas/VendasDashboard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function VendasPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/"); // redirect to login
  }

  return (
    <section className="bg-background text-foreground font-sans container mx-auto px-4 md:px-8 py-12">
      <Suspense fallback={<div>Carregando vendas...</div>}>
        <VendasDashboard />
      </Suspense>
    </section>
  );
}
