import { supabase } from '../../../lib/supabase';

export type NutritionTargets = {
  calories: number | null;
  protein: number | null;
};

export async function getNutritionTargets(userId: string): Promise<NutritionTargets> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('user_goals')
    .select('daily_calorie_target, daily_protein_target_g')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    calories: data?.daily_calorie_target ?? null,
    protein: data?.daily_protein_target_g === null || data?.daily_protein_target_g === undefined
      ? null
      : Number(data.daily_protein_target_g),
  };
}

export async function saveNutritionTargets(userId: string, targets: { calories: number; protein: number }) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const client = supabase;
  const { data: activeGoal, error: lookupError } = await client
    .from('user_goals')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  const values = {
    daily_calorie_target: Math.round(targets.calories),
    daily_protein_target_g: Math.round(targets.protein * 10) / 10,
  };
  const result = activeGoal
    ? await client.from('user_goals').update(values).eq('id', activeGoal.id)
    : await client.from('user_goals').insert({
        ...values,
        goal_type: 'general_wellness',
        is_active: true,
        user_id: userId,
      });

  if (result.error) throw new Error(result.error.message);
}
