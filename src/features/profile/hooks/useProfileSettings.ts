import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../../providers/AuthProvider';
import type { ProfileSettings } from '../profileTypes';
import { getProfileSettings, saveProfileSettings } from '../services/profileService';

export function useProfileSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getProfileSettings(user.id);
      setSettings(result);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Profile settings could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const save = async (nextSettings: ProfileSettings) => {
    if (!user) throw new Error('Sign in before updating your profile.');
    setIsSaving(true);
    try {
      await saveProfileSettings({ ...nextSettings, userId: user.id });
      setSettings(nextSettings);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    email: user?.email ?? '',
    isLoading,
    isSaving,
    loadError,
    refresh: loadSettings,
    save,
    settings,
  };
}
