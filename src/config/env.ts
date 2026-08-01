const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

const isPlaceholder = (value: string | undefined) =>
  !value || value.includes('YOUR_') || value.includes('example');

export const env = {
  supabaseUrl,
  supabasePublishableKey,
  isSupabaseConfigured:
    !isPlaceholder(supabaseUrl) && !isPlaceholder(supabasePublishableKey),
} as const;

