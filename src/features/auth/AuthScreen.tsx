import { useState } from 'react';

import { EmailAuthForm, type AuthMode } from './EmailAuthForm';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('sign-in');

  return <EmailAuthForm mode={mode} onSwitchMode={setMode} />;
}
