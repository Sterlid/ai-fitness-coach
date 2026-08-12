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
