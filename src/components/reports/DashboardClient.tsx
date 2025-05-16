"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

interface LeadStatusData {
  name: string;
  value: number;
}

interface OrcamentoStatusData {
  name: string;
  value: number;
}

interface RecentLead {
    id: string;
    nome: string;
    status: string;
    createdAt: string;
    vendedor?: { name: string | null } | null;
}

interface SummaryStats {
    totalClientes: number;
    totalLeads: number;
    totalOrcamentos: number;
    totalProdutos: number;
}

interface DashboardData {
  leadsByStatus: LeadStatusData[];
  orcamentosByStatus: OrcamentoStatusData[];
  recentLeads: RecentLead[];
  summaryStats: SummaryStats;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/summary");
        if (!response.ok) {
          throw new Error("Falha ao carregar dados do dashboard");
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        console.error("Erro no dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <p>Carregando dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-500">Erro ao carregar dashboard: {error}</p>;
  }

  if (!data) {
    return <p>Nenhum dado encontrado para o dashboard.</p>;
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                    {/* Icon can be added here */}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.summaryStats.totalClientes}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.summaryStats.totalLeads}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Orçamentos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.summaryStats.totalOrcamentos}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produtos em Estoque</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.summaryStats.totalProdutos}</div>
                </CardContent>
            </Card>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.leadsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.leadsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orçamentos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.orcamentosByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-2">
                {data.recentLeads.map(lead => (
                    <li key={lead.id} className="p-2 border rounded-md hover:bg-gray-50">
                        <p className="font-semibold">{lead.nome} <Badge variant="secondary">{lead.status}</Badge></p>
                        <p className="text-xs text-gray-500">
                            Criado em: {new Date(lead.createdAt).toLocaleDateString()} por {lead.vendedor?.name || "N/A"}
                        </p>
                    </li>
                ))}
            </ul>
        </CardContent>
      </Card>

      {/* Add more charts and data sections here based on requirements */}
    </div>
  );
}

