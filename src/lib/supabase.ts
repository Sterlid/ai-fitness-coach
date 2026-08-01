import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

import { env } from '../config/env';
import type { Database } from '../types/database';

export const isSupabaseConfigured = env.isSupabaseConfigured;

export const supabase = isSupabaseConfigured
  ? createClient<Database>(env.supabaseUrl!, env.supabasePublishableKey!, {
      auth: {
        storage: globalThis.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

