import { supabase } from '../../../lib/supabase';
import type { MealAnalysis } from '../mealAnalysis';
import type { Meal, MealType } from '../mealTypes';

type MealRangeResult = {
  meals: Meal[];
  imageUrls: Record<string, string>;
};

type CreateMealInput = {
  userId: string;
  mealType: MealType;
  name: string;
  description: string;
  serving: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  imageFile: File | null;
  aiAnalysis: MealAnalysis | null;
};

function storagePathFor(userId: string, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const token =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${userId}/${token}.${extension}`;
}

export async function getMealsBetween(userId: string, start: Date, end: Date): Promise<MealRangeResult> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const client = supabase;
  const { data, error } = await client
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .gte('eaten_at', start.toISOString())
    .lt('eaten_at', end.toISOString())
    .order('eaten_at', { ascending: false });

  if (error) throw new Error(error.message);

  const meals = data ?? [];
  const imageEntries = await Promise.all(
    meals
      .filter((meal) => meal.image_path)
      .map(async (meal) => {
        const { data: imageData } = await client.storage.from('meal-images').createSignedUrl(meal.image_path!, 3600);
        return [meal.id, imageData?.signedUrl] as const;
      }),
  );

  return {
    meals,
    imageUrls: Object.fromEntries(
      imageEntries.filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
  };
}

export async function createMeal(input: CreateMealInput) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const client = supabase;
  const source = input.imageFile
    ? input.description.trim()
      ? 'photo_and_description'
      : 'photo'
    : input.description.trim()
      ? 'description'
      : 'manual';
  const imagePath = input.imageFile ? storagePathFor(input.userId, input.imageFile) : null;

  if (imagePath && input.imageFile) {
    const { error: uploadError } = await client.storage.from('meal-images').upload(imagePath, input.imageFile, {
      cacheControl: '3600',
      contentType: input.imageFile.type,
      upsert: false,
    });

    if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
  }

  const { data: savedMeal, error } = await client
    .from('meals')
    .insert({
      user_id: input.userId,
      name: input.name.trim(),
      source,
      description: input.description.trim() || null,
      image_path: imagePath,
      estimated_calories: input.calories === null ? null : Math.round(input.calories),
      protein_g: input.protein,
      carbs_g: input.carbs,
      fat_g: input.fat,
      confidence_score: input.aiAnalysis?.confidence_score ?? null,
      is_user_confirmed: true,
      analysis_metadata: {
        meal_type: input.mealType,
        serving: input.serving.trim() || null,
        ai_analysis: input.aiAnalysis ? {
          provider: input.aiAnalysis.provider,
          model: input.aiAnalysis.model,
          analyzed_at: input.aiAnalysis.analyzed_at,
          assumptions: input.aiAnalysis.assumptions,
          warnings: input.aiAnalysis.warnings,
          original_estimate: {
            name: input.aiAnalysis.meal_name,
            serving: input.aiAnalysis.serving,
            calories: input.aiAnalysis.estimated_calories,
            protein_g: input.aiAnalysis.protein_g,
            carbs_g: input.aiAnalysis.carbs_g,
            fat_g: input.aiAnalysis.fat_g,
          },
        } : null,
      },
    })
    .select('id')
    .single();

  if (error || !savedMeal) {
    if (imagePath) await client.storage.from('meal-images').remove([imagePath]);
    throw new Error(error?.message ?? 'The meal could not be saved.');
  }

  if (input.aiAnalysis?.items.length) {
    const { error: itemError } = await client.from('meal_items').insert(
      input.aiAnalysis.items.map((item, index) => ({
        meal_id: savedMeal.id,
        name: item.name,
        quantity: item.quantity || null,
        unit: item.unit || null,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        confidence_score: item.confidence_score,
        sort_order: index,
      })),
    );

    if (itemError) {
      await client.from('meals').delete().eq('id', savedMeal.id);
      if (imagePath) await client.storage.from('meal-images').remove([imagePath]);
      throw new Error(`Meal items could not be saved: ${itemError.message}`);
    }
  }
}
