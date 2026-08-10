import type { Database } from '../../types/database';

export type Meal = Database['public']['Tables']['meals']['Row'];
export type MealMetadata = { meal_type?: string; serving?: string | null };
export type MealNutrient = 'protein_g' | 'carbs_g' | 'fat_g';
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
