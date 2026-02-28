import { api } from "./api";

export const getEventById = async () => {
  try {
    const response = await api.get(`/api/events`);
    console.log(response.data)
    return response.data;
    
  } catch (error) {
    console.error('Erro ao buscar Eventos', error);
    return [];
  }
};

export const addEvent = async (eventData) => {
  try {
    const response = await api.post(`/api/events`, eventData);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar Evento', error.response?.data || error.message);
    throw error; // Lançar o erro para ser tratado no componente
  }
};


export const sendEsboco = async (esbocoData) => {
  try {
    const response = await api.post(`/api/files/upload`, esbocoData);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar esboço', error.response?.data || error.message);
    throw error; // Lançar o erro para ser tratado no componente
  }
};



