import { api } from "./api";

interface CelulaData {
  whatsapp: string;
  address: string;
  schedule: string;
  leaderId: number;
  disciplerId: number;
  pastorId: number;
  obreiroId: number;
}

export const getAllCellsLeader = async (leaderId: number) => {
  try {
    const response = await api.get(`/api/reports/leader/${leaderId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch cells', error);
    throw error;
  }
};

export const getAllCellsForObreiro = async (obreiroId: number) => {
    try {
      const response = await api.get(`/api/reports/worker/${obreiroId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cells', error);
      throw error;
    }
  };

  export const getAllCellsForDisc = async (discipuladorId: number) => {
    try {
      const response = await api.get(`/api/reports/discipler/${discipuladorId}`);
      return response.data;
      } catch (error) {
      console.error('Failed to fetch cells', error);
      throw error;
    }
  };

  export const getAllCellsForPastor = async (pastorId: number) => {
    try {
      const response = await api.get(`/api/reports/pastor/${pastorId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cells', error);
      throw error;
    }
  };
  

export const updateCell = async (cellId: number, data: any) => {
  try {
    const response = await api.put(`/api/reports/edit/${cellId}`, data);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update cell');
  }
};

export const deleteCell = async (cellId: number) => {
  try {
    const response = await api.delete(`/api/reports/delete/${cellId}`);
    return response.data;
  } catch (error) {
    console.error('Error while deleting cell:', error);
    throw new Error('Failed to delete cell');
  }
};


// Funções para atualizar e deletar células
export const fetchCellLeader = async (leaderId: number) => {
    try {
      const response = await api.get(`/api/reports/leader/${leaderId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed reports leaders cell');
    }
  };
  
 
  export const getAllCellsForMaps = async () => {
    try {
      const response = await api.get(`/api/all/cells`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cells', error);
      throw error;
    }
  };

  export const createCells = async (celulaData: CelulaData) => {
    try {
      const response = await api.post('/api/add/cells', celulaData);
      return response.data;
    } catch (error: any) {
      console.error('Cell creation failed', error);
      throw new Error(error?.response?.data?.message || 'Cell creation failed');
    }
  };

  
  
