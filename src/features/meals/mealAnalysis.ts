import { supabase } from '../../lib/supabase';

export type MealAnalysisItem = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence_score: number;
};

export type MealAnalysis = {
  is_food: boolean;
  meal_name: string;
  serving: string;
  estimated_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence_score: number;
  items: MealAnalysisItem[];
  assumptions: string[];
  warnings: string[];
  provider: 'google-gemini';
  model: string;
  analyzed_at: string;
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The photo could not be read.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.split(',', 2)[1];
      if (!base64) reject(new Error('The photo could not be encoded.'));
      else resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

export async function analyzeMealPhoto(file: File, description: string, serving: string) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const imageBase64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke<MealAnalysis>('analyze-meal', {
    body: {
      imageBase64,
      mimeType: file.type,
      description: description.trim(),
      serving: serving.trim(),
    },
  });

  if (error) {
    let message = error.message;
    const context = 'context' in error ? error.context : undefined;
    if (context instanceof Response) {
      const body = await context.clone().json().catch(() => null) as { error?: string } | null;
      if (body?.error) message = body.error;
    }
    throw new Error(message);
  }
  if (!data?.is_food) throw new Error('That does not look like a meal. Try a clearer photo.');
  return data;
}
