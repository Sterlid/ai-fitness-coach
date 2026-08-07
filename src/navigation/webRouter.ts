import { Platform } from 'react-native';
import { useEffect, useState } from 'react';

export type AppPath = '/' | '/login' | '/sign-up' | '/setup' | '/home' | '/log-meal' | '/reset-password';

let nativePath: AppPath = '/';
const pathListeners = new Set<() => void>();

function currentPath(): AppPath {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return nativePath;

  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
  return normalizedPath === '/login' || normalizedPath === '/sign-up' || normalizedPath === '/setup' || normalizedPath === '/home' || normalizedPath === '/log-meal' || normalizedPath === '/reset-password'
    ? normalizedPath
    : '/';
}

export function useAppPath() {
  const [path, setPath] = useState<AppPath>(currentPath);

  useEffect(() => {
    const handlePathChange = () => setPath(currentPath());
    pathListeners.add(handlePathChange);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePathChange);
    }

    return () => {
      pathListeners.delete(handlePathChange);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePathChange);
      }
    };
  }, []);

  return path;
}

export function navigateToPath(path: AppPath, replace = false) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    if (nativePath === path) return;
    nativePath = path;
    pathListeners.forEach((listener) => listener());
    return;
  }

  if (currentPath() === path) return;

  const method = replace ? 'replaceState' : 'pushState';
  window.history[method]({}, '', path);
  window.dispatchEvent(new Event('popstate'));
}
