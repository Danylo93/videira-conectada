import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthContext from './UserContext';

interface MemberData {
  averageMembers: number;
  averageAttendees: number;
}

interface DataState {
  discipulador: MemberData;
}

interface DataContextType {
  data: DataState;
  //fetchData: () => Promise<void>;
}

const DataContextDisc = createContext<DataContextType>({
  data: {
    discipulador: { averageMembers: 0, averageAttendees: 0 },
  },
 // fetchData: async () => {},
});

export const DataProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState<DataState>({
    discipulador: { averageMembers: 0, averageAttendees: 0 },
  });

  // const fetchData = async () => {
  //   try {
  //     if (user?.id) {
  //       const discipuladorData = await apiService.geTotalMembersOfDisc(user?.id);
  //       console.log('Received Discipulador data:', discipuladorData);
  //       setData({ discipulador: discipuladorData });
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch data of Discipulador', error);
  //   }
  // };

  // useEffect(() => {
  //   fetchData();
  // }, []);

  return (
    <DataContextDisc.Provider value={{ data }}>
      {children}
    </DataContextDisc.Provider>
  );
};

export default DataContextDisc;
