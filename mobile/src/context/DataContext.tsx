import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AuthContext from "./UserContext";
import { fetchCellLeader } from "../services/cellService";
import {
  geTotalReportMonthDiscipler,
  geTotalReportMonthLeader,
  getTotalReportMonthObreiro,
  getTotalReportMonthPastor,
} from "../services/reportService";
import { normalizeRole } from "../utils/role";

interface DataGraph {
  averageMembers: number;
  averageAttendees: number;
  averageVisitors: number;
  month: string;
}

interface DataState {
  dataGraph: DataGraph;
}

interface DataContextType {
  data: DataState;
  fetchData: () => Promise<void>;
  cellReport: () => Promise<void>;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getDefaultDataGraph(): DataGraph {
  return {
    averageMembers: 0,
    averageAttendees: 0,
    averageVisitors: 0,
    month: getCurrentMonthKey(),
  };
}

function normalizeGraph(raw: any): DataGraph {
  if (Array.isArray(raw)) {
    return getDefaultDataGraph();
  }

  return {
    averageMembers: Number(raw?.averageMembers ?? 0),
    averageAttendees: Number(raw?.averageAttendees ?? 0),
    averageVisitors: Number(raw?.averageVisitors ?? 0),
    month: raw?.month || getCurrentMonthKey(),
  };
}

const DataContext = createContext<DataContextType>({
  data: {
    dataGraph: getDefaultDataGraph(),
  },
  fetchData: async () => {},
  cellReport: async () => {},
});

export const DataProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  const role = normalizeRole(user?.role);
  const [data, setData] = useState<DataState>({
    dataGraph: getDefaultDataGraph(),
  });

  const fetchDataByRole = useCallback(async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    try {
      if (role === "pastor") {
        const pastorData = await getTotalReportMonthPastor({
          pastorId: String(user?.id || ""),
          month,
          year,
        });
        setData({ dataGraph: normalizeGraph(pastorData) });
        return;
      }

      if (role === "obreiro") {
        const obreiroData = await getTotalReportMonthObreiro({
          workerId: String(user?.id || ""),
          month,
          year,
        });
        setData({ dataGraph: normalizeGraph(obreiroData) });
        return;
      }

      if (role === "discipulador") {
        const disciplerData = await geTotalReportMonthDiscipler(String(user?.id || ""));
        setData({ dataGraph: normalizeGraph(disciplerData) });
        return;
      }

      if (role === "lider") {
        const leaderData = await geTotalReportMonthLeader();
        setData({ dataGraph: normalizeGraph(leaderData) });
        return;
      }

      setData({ dataGraph: getDefaultDataGraph() });
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard por perfil:", error);
      setData({ dataGraph: getDefaultDataGraph() });
    }
  }, [role, user?.id]);

  const fetchReportLeader = useCallback(async () => {
    try {
      const leaderData = await fetchCellLeader(user?.id);
      setData({ dataGraph: normalizeGraph(leaderData) });
    } catch (error) {
      console.error("Erro ao buscar relatorio de lider:", error);
      setData({ dataGraph: getDefaultDataGraph() });
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDataByRole();
  }, [fetchDataByRole]);

  return (
    <DataContext.Provider value={{ data, fetchData: fetchDataByRole, cellReport: fetchReportLeader }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
