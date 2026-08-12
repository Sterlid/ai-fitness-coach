import { Platform } from 'react-native';
import { useEffect, useState } from 'react';

export type AppPath = '/' | '/login' | '/sign-up' | '/setup' | '/home' | '/meals' | '/log-meal' | '/meal' | '/profile' | '/reset-password';
export type MealReturnPath = '/home' | '/meals';
export type MealsView = 'today' | 'history';

type MealRoute = {
  id: string;
  mealsView: MealsView;
  returnPath: MealReturnPath;
};

let nativePath: AppPath = '/';
let nativeMealRoute: MealRoute | null = null;
let nativeMealsView: MealsView = 'today';
const pathListeners = new Set<() => void>();

function currentPath(): AppPath {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return nativePath;

  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
  return normalizedPath === '/login' || normalizedPath === '/sign-up' || normalizedPath === '/setup' || normalizedPath === '/home' || normalizedPath === '/meals' || normalizedPath === '/log-meal' || normalizedPath === '/meal' || normalizedPath === '/profile' || normalizedPath === '/reset-password'
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

export function navigateToMeal(
  id: string,
  returnPath: MealReturnPath = '/meals',
  mealsView: MealsView = 'today',
) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    nativeMealRoute = { id, mealsView, returnPath };
    navigateToPath('/meal');
    return;
  }

  const query = new URLSearchParams({ from: returnPath, id, view: mealsView });
  window.history.pushState({}, '', `/meal?${query.toString()}`);
  window.dispatchEvent(new Event('popstate'));
}

export function getMealRoute(): MealRoute | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return nativeMealRoute;

  const query = new URLSearchParams(window.location.search);
  const id = query.get('id')?.trim();
  if (!id) return null;

  return {
    id,
    mealsView: query.get('view') === 'history' ? 'history' : 'today',
    returnPath: query.get('from') === '/home' ? '/home' : '/meals',
  };
}

export function getMealsView(): MealsView {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return nativeMealsView;
  return new URLSearchParams(window.location.search).get('view') === 'history' ? 'history' : 'today';
}

export function navigateToMeals(view: MealsView = 'today', replace = false) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    nativeMealsView = view;
    navigateToPath('/meals', replace);
    return;
  }

  const url = view === 'history' ? '/meals?view=history' : '/meals';
  if (`${window.location.pathname}${window.location.search}` === url) return;
  const method = replace ? 'replaceState' : 'pushState';
  window.history[method]({}, '', url);
  window.dispatchEvent(new Event('popstate'));
}
