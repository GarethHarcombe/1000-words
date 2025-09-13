// contexts/CaravanContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AccessoryKey } from '@/components/caravan/accessories';

type CaravanContextValue = {
  accessories: AccessoryKey[];
  toggleAccessory: (key: AccessoryKey) => void;
  setAccessories: (keys: AccessoryKey[]) => void;
};

const CaravanContext = createContext<CaravanContextValue | undefined>(undefined);
const STORE_KEY = 'caravan:accessories';

export const CaravanProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [accessories, setAccessoriesState] = useState<AccessoryKey[]>([]);

  // Load persisted selection
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) setAccessoriesState(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(accessories));
      } catch {}
    })();
  }, [accessories]);

  const toggleAccessory = useCallback((key: AccessoryKey) => {
    setAccessoriesState(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }, []);

  const setAccessories = useCallback((keys: AccessoryKey[]) => {
    setAccessoriesState(keys);
  }, []);

  return (
    <CaravanContext.Provider value={{ accessories, toggleAccessory, setAccessories }}>
      {children}
    </CaravanContext.Provider>
  );
};

export const useCaravanAccessories = () => {
  const ctx = useContext(CaravanContext);
  if (!ctx) throw new Error('useCaravanAccessories must be used within CaravanProvider');
  return ctx;
};
