import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { Platform } from 'react-native';

import { createClient } from '@supabase/supabase-js';

import { env } from '../config/env';
import type { Database } from '../types/database';

const rememberMeKey = 'ai-fitness-coach:remember-me';

const browserStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') return null;

    const rememberMe = window.localStorage.getItem(rememberMeKey);
    if (rememberMe === 'false') return window.sessionStorage.getItem(key);
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return;

    const rememberMe = window.localStorage.getItem(rememberMeKey) !== 'false';
    const target = rememberMe ? window.localStorage : window.sessionStorage;
    const other = rememberMe ? window.sessionStorage : window.localStorage;
    other.removeItem(key);
    target.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export function setRememberMePreference(rememberMe: boolean) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(rememberMeKey, String(rememberMe));
  }
}

export const isSupabaseConfigured = env.isSupabaseConfigured;

export const supabase = isSupabaseConfigured
  ? createClient<Database>(env.supabaseUrl!, env.supabasePublishableKey!, {
      auth: {
        storage: Platform.OS === 'web' ? browserStorage : globalThis.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
