"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MonthlyData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${months[parseInt(m) - 1]}/${year.slice(2)}`;
}

export function MembersChart({ data }: { data: MonthlyData[] }) {
  const chartData = data.slice(-12).map((d) => ({
    ...d,
    label: formatMonth(d.month),
  }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-playfair text-base font-semibold text-ink">
          Novos Membros por Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#888" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a1a",
                border: "none",
                borderRadius: 8,
                color: "#c9a96e",
                fontSize: 12,
              }}
              cursor={{ fill: "#f5f0e8" }}
            />
            <Bar dataKey="count" fill="#c9a96e" radius={[4, 4, 0, 0]} name="Membros" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
