import { useEffect, useState } from 'react';
import Constants from 'expo-constants';

// Only use expo-updates in production builds (not Expo Go / dev client)
const isEmbedded = Constants.appOwnership !== 'expo' && !__DEV__;

interface UpdateState {
  available: boolean;
  applying: boolean;
}

export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>({ available: false, applying: false });

  useEffect(() => {
    if (!isEmbedded) return;
    checkForUpdate();
  }, []);

  async function checkForUpdate() {
    try {
      const Updates = await import('expo-updates');
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        setState((s) => ({ ...s, available: true }));
      }
    } catch {
      // Silent — updates are non-critical
    }
  }

  async function applyUpdate() {
    setState((s) => ({ ...s, applying: true }));
    try {
      const Updates = await import('expo-updates');
      await Updates.reloadAsync();
    } catch {
      setState((s) => ({ ...s, applying: false }));
    }
  }

  return { updateAvailable: state.available, applying: state.applying, applyUpdate };
}
