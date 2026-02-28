//listar Lideres por Discipulador

import { api } from "./api";

  
export const listLeaderByDiscipler = async (disciplerId: string | number) => {
    
    const response = await api.get(`/api/leaders-by-discipler/${disciplerId}`);
    return response.data

  
};

//listar  Discipulador por Obreiro

export const listDisciplerByObreiro = async (workerId: string | number) => {
  
  const response = await api.get(`/api/disciplers-by-worker/${workerId}`);
  return response.data


};
