import { Platform } from 'react-native';
import { useEffect, useState } from 'react';

export type AppPath = '/' | '/login' | '/sign-up' | '/setup' | '/home' | '/reset-password';

function currentPath(): AppPath {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '/';

  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
  return normalizedPath === '/login' || normalizedPath === '/sign-up' || normalizedPath === '/setup' || normalizedPath === '/home' || normalizedPath === '/reset-password'
    ? normalizedPath
    : '/';
}

export function useAppPath() {
  const [path, setPath] = useState<AppPath>(currentPath);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handlePopState = () => setPath(currentPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return path;
}

export function navigateToPath(path: AppPath, replace = false) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || currentPath() === path) return;

  const method = replace ? 'replaceState' : 'pushState';
  window.history[method]({}, '', path);
  window.dispatchEvent(new Event('popstate'));
}
