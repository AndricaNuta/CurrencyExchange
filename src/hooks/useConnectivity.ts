import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useConnectivity() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const sub = NetInfo.addEventListener(s => {
      setOnline(s.isConnected ?? true);
    });
    return () => sub && sub();
  }, []);

  return {
    online
  };

}
