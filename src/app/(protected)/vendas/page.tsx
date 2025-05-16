
import { VendasDashboard } from "@/components/vendas/VendasDashboard";
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function VendasPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    redirect("/")   // volta para a página de login
  }
  return (
      <VendasDashboard />
  );
}
