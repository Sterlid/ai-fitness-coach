import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { EmailAuthForm, type AuthMode } from './EmailAuthForm';
import { navigateToPath } from '../../navigation/webRouter';

type AuthScreenProps = {
  initialMode?: AuthMode;
};

export function AuthScreen({ initialMode = 'sign-in' }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);

    if (Platform.OS !== 'web') return;
    if (nextMode === 'sign-up') navigateToPath('/sign-up', true);
    if (nextMode === 'sign-in' && mode === 'sign-up') navigateToPath('/login', true);
  };

  return <EmailAuthForm mode={mode} onSwitchMode={switchMode} />;
}
