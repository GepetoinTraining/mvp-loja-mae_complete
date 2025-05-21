import { DashboardClient } from "@/components/reports/DashboardClient";

export default async function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard Principal</h1>
      <DashboardClient />
    </div>
  );
}
