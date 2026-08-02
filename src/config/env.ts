const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const configuredAuthRedirectUrl = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();

const isPlaceholder = (value: string | undefined) =>
  !value || value.includes('YOUR_') || value.includes('example');
const isLocalUrl = (value: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(value);

export const env = {
  supabaseUrl,
  supabasePublishableKey,
  configuredAuthRedirectUrl,
  isSupabaseConfigured:
    !isPlaceholder(supabaseUrl) && !isPlaceholder(supabasePublishableKey),
} as const;

/**
 * Use an explicit environment URL when one is configured, otherwise stay on
 * the origin that the user is currently visiting. This keeps local, preview,
 * and production confirmation links on the correct site.
 */
export function getAuthRedirectUrl() {
  const browserOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : undefined;
  const configuredMatchesCurrentEnvironment =
    configuredAuthRedirectUrl &&
    (!browserOrigin || isLocalUrl(configuredAuthRedirectUrl) === isLocalUrl(browserOrigin));
  const redirectUrl = configuredMatchesCurrentEnvironment ? configuredAuthRedirectUrl : browserOrigin;

  if (!redirectUrl) return undefined;
  return redirectUrl.endsWith('/') ? redirectUrl : `${redirectUrl}/`;
}
