import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WellnessContextType {
  wellnessData: any;
  setWellnessData: (data: unknown) => void;
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined);

export const WellnessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wellnessData, setWellnessData] = useState<any>(null);

  return (
    <WellnessContext.Provider value={{ wellnessData, setWellnessData }}>
      {children}
    </WellnessContext.Provider>
  );
};

export const useWellness = () => {
  const context = useContext(WellnessContext);
  if (!context) {
    throw new Error('useWellness must be used within a WellnessProvider');
  }
  return context;
};