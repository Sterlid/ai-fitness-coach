import { supabase } from '../../../lib/supabase';
import type { ProfileSettings, SaveProfileSettingsInput } from '../profileTypes';

const emptySettings: ProfileSettings = {
  calorieTarget: null,
  currentWeightKg: null,
  displayName: '',
  goalType: 'general_wellness',
  heightCm: null,
  proteinTarget: null,
  targetWeightKg: null,
  units: 'metric',
};

export async function getProfileSettings(userId: string): Promise<ProfileSettings> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const [profileResult, goalResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, units_system, height_cm, current_weight_kg')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_goals')
      .select('goal_type, target_weight_kg, daily_calorie_target, daily_protein_target_g')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  if (profileResult.error) throw new Error(profileResult.error.message);
  if (goalResult.error) throw new Error(goalResult.error.message);

  const profile = profileResult.data;
  const goal = goalResult.data;
  return {
    ...emptySettings,
    calorieTarget: goal?.daily_calorie_target ?? null,
    currentWeightKg: profile?.current_weight_kg === null || profile?.current_weight_kg === undefined
      ? null
      : Number(profile.current_weight_kg),
    displayName: profile?.display_name ?? '',
    goalType: goal?.goal_type ?? 'general_wellness',
    heightCm: profile?.height_cm === null || profile?.height_cm === undefined ? null : Number(profile.height_cm),
    proteinTarget: goal?.daily_protein_target_g === null || goal?.daily_protein_target_g === undefined
      ? null
      : Number(goal.daily_protein_target_g),
    targetWeightKg: goal?.target_weight_kg === null || goal?.target_weight_kg === undefined
      ? null
      : Number(goal.target_weight_kg),
    units: profile?.units_system === 'imperial' ? 'imperial' : 'metric',
  };
}

export async function saveProfileSettings(input: SaveProfileSettingsInput) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const client = supabase;

  const { error: profileError } = await client.from('profiles').upsert({
    current_weight_kg: input.currentWeightKg,
    display_name: input.displayName.trim(),
    height_cm: input.heightCm,
    id: input.userId,
    onboarding_completed: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    units_system: input.units,
  });
  if (profileError) throw new Error(profileError.message);

  const { data: activeGoal, error: lookupError } = await client
    .from('user_goals')
    .select('id')
    .eq('user_id', input.userId)
    .eq('is_active', true)
    .maybeSingle();
  if (lookupError) throw new Error(lookupError.message);

  const goalValues = {
    daily_calorie_target: input.calorieTarget,
    daily_protein_target_g: input.proteinTarget,
    goal_type: input.goalType,
    is_active: true,
    target_weight_kg: input.targetWeightKg,
  };
  const goalResult = activeGoal
    ? await client.from('user_goals').update(goalValues).eq('id', activeGoal.id)
    : await client.from('user_goals').insert({ ...goalValues, user_id: input.userId });
  if (goalResult.error) throw new Error(goalResult.error.message);

  const { error: userError } = await client.auth.updateUser({
    data: { display_name: input.displayName.trim() },
  });
  if (userError) throw new Error(userError.message);
}

export async function signOut() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
