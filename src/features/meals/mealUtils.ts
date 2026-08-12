import type { Meal, MealMetadata, MealNutrient } from './mealTypes';

export function mealMetadata(value: Meal['analysis_metadata']): MealMetadata {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return value as MealMetadata;
}

export function optionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfWeek(date: Date) {
  const result = startOfDay(date);
  const daysSinceMonday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - daysSinceMonday);
  return result;
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function mealsForDate(meals: Meal[], date: Date) {
  const key = dateKey(date);
  return meals.filter((meal) => dateKey(new Date(meal.eaten_at)) === key);
}

export function caloriesFor(meals: Meal[]) {
  return meals.reduce((total, meal) => total + (meal.estimated_calories ?? 0), 0);
}

export function nutrientFor(meals: Meal[], nutrient: MealNutrient) {
  return meals.reduce((total, meal) => total + Number(meal[nutrient] ?? 0), 0);
}
