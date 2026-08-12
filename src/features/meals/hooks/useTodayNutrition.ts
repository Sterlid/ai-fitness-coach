import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../../providers/AuthProvider';
import { getMealsBetween } from '../services/mealService';
import {
  getNutritionTargets,
  type NutritionTargets,
} from '../services/nutritionTargetService';
import type { Meal } from '../mealTypes';
import { addDays, caloriesFor, nutrientFor, startOfDay } from '../mealUtils';

export function useTodayNutrition() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealImageUrls, setMealImageUrls] = useState<Record<string, string>>({});
  const [targets, setTargets] = useState<NutritionTargets>({ calories: null, protein: null });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadToday = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    const start = startOfDay(new Date());

    try {
      const [mealResult, targetResult] = await Promise.all([
        getMealsBetween(user.id, start, addDays(start, 1)),
        getNutritionTargets(user.id),
      ]);
      setMeals(mealResult.meals);
      setMealImageUrls(mealResult.imageUrls);
      setTargets(targetResult);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Today’s nutrition could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  return {
    isLoading,
    loadError,
    mealImageUrls,
    meals,
    targets,
    totals: {
      calories: caloriesFor(meals),
      carbs: nutrientFor(meals, 'carbs_g'),
      fat: nutrientFor(meals, 'fat_g'),
      protein: nutrientFor(meals, 'protein_g'),
    },
  };
}
