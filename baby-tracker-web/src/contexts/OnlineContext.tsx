import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { errorService } from '../services/errorService';

interface OnlineContextType {
  isOnline: boolean;
  lastError: Error | null;
  setLastError: (error: Error | null) => void;
}

const OnlineContext = createContext<OnlineContextType | undefined>(undefined);

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastError, setLastError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (error: Error | null) => {
        setLastError(error);
        if(error == null) {
            setIsOnline(true);
        } else if (error?.message.includes('Failed to fetch')) {
            setIsOnline(false);
        } 
    }

    errorService.addListener(handleError);

    return () => {
      errorService.removeListener(handleError);
    };
  }, []);

  return (
    <OnlineContext.Provider value={{ isOnline, lastError, setLastError }}>
      {children}
    </OnlineContext.Provider>
  );
}

export function useOnline() {
  const context = useContext(OnlineContext);
  if (context === undefined) {
    throw new Error('useOnline must be used within an OnlineProvider');
  }
  return context;
} 