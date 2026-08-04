-- These helpers are invoked only by database triggers. They should not be
-- callable through PostgREST's public RPC surface.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_confirmed_user() from public, anon, authenticated;
