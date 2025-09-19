// Enhanced Reports System - Charts Component
// Reusable charts for the reports dashboard

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, LineChart, AreaChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, Line, Area } from 'recharts';

interface ChartData {
  date: string;
  attendance: number;
  visitors: number;
  conversions: number;
  [key: string]: any;
}

interface ChartsProps {
  attendanceTrend: ChartData[];
  cultosByType: Record<string, number>;
  lostMembersByStatus: Record<string, number>;
  lostMembersByPriority: Record<string, number>;
}

const Charts: React.FC<ChartsProps> = ({
  attendanceTrend,
  cultosByType,
  lostMembersByStatus,
  lostMembersByPriority
}) => {
  // Convert cultosByType to array for chart
  const cultosTypeData = Object.entries(cultosByType).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count
  }));

  // Convert lostMembersByStatus to array for chart
  const lostMembersStatusData = Object.entries(lostMembersByStatus).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count
  }));

  // Convert lostMembersByPriority to array for chart
  const lostMembersPriorityData = Object.entries(lostMembersByPriority).map(([priority, count]) => ({
    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
    count
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Attendance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Presença em Cultos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                formatter={(value, name) => [
                  value,
                  name === 'attendance' ? 'Presenças' : 
                  name === 'visitors' ? 'Visitantes' : 
                  name === 'conversions' ? 'Conversões' : name
                ]}
              />
              <Legend />
              <Bar dataKey="attendance" fill="#3b82f6" name="Presenças" />
              <Bar dataKey="visitors" fill="#10b981" name="Visitantes" />
              <Bar dataKey="conversions" fill="#f59e0b" name="Conversões" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cultos by Type Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Cultos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cultosTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lost Members by Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Membros Perdidos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={lostMembersStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stackId="1" stroke="#ef4444" fill="#fecaca" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lost Members by Priority Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Prioridade dos Membros Perdidos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lostMembersPriorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Charts;
