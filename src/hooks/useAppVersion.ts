/**
 * useAppVersion Hook - Checks minimum app version from Firestore config
 * Shows whether force update modal should be displayed
 */

import Constants from 'expo-constants';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../services/firebase';

type VersionConfig = {
  minVersion?: string;
  playStoreUrl?: string;
};

interface AppVersionState {
  currentVersion: string;
  minimumVersion: string | null;
  needsUpdate: boolean;
  playStoreUrl: string;
  isChecking: boolean;
  checkError: string | null;
}

const DEFAULT_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.dukandar.app';

function normalizeVersion(version: string): number[] {
  return version
    .split('.')
    .map((part) => parseInt(part, 10))
    .map((num) => (Number.isNaN(num) ? 0 : num));
}

/**
 * Returns true if current version is lower than minimum required.
 */
function isVersionLower(current: string, minimum: string): boolean {
  const currentParts = normalizeVersion(current);
  const minimumParts = normalizeVersion(minimum);
  const maxLength = Math.max(currentParts.length, minimumParts.length);

  for (let i = 0; i < maxLength; i += 1) {
    const c = currentParts[i] || 0;
    const m = minimumParts[i] || 0;

    if (c < m) return true;
    if (c > m) return false;
  }

  return false;
}

export function useAppVersion(): AppVersionState {
  const currentVersion = useMemo(() => {
    return Constants.expoConfig?.version || '1.0.0';
  }, []);

  const [minimumVersion, setMinimumVersion] = useState<string | null>(null);
  const [playStoreUrl, setPlayStoreUrl] = useState(DEFAULT_PLAY_STORE_URL);
  const [isChecking, setIsChecking] = useState(true);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        setIsChecking(true);
        setCheckError(null);

        const configRef = doc(db, 'config', 'appConfig');
        const snapshot = await getDoc(configRef);

        if (!snapshot.exists()) {
          setMinimumVersion(null);
          return;
        }

        const data = snapshot.data() as VersionConfig;
        if (data.minVersion) {
          setMinimumVersion(data.minVersion);
        }
        if (data.playStoreUrl) {
          setPlayStoreUrl(data.playStoreUrl);
        }
      } catch (error: any) {
        console.warn('[useAppVersion] Version check failed:', error?.message || error);
        setCheckError(error?.message || 'Version check failed');
      } finally {
        setIsChecking(false);
      }
    };

    checkVersion();
  }, []);

  const needsUpdate = useMemo(() => {
    if (!minimumVersion) return false;
    return isVersionLower(currentVersion, minimumVersion);
  }, [currentVersion, minimumVersion]);

  return {
    currentVersion,
    minimumVersion,
    needsUpdate,
    playStoreUrl,
    isChecking,
    checkError,
  };
}
