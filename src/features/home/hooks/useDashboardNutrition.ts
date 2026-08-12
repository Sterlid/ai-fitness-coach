import { useCallback, useEffect, useState } from 'react';

import { getMealsBetween } from '../../meals/services/mealService';
import {
  getNutritionTargets,
  type NutritionTargets,
} from '../../meals/services/nutritionTargetService';
import {
  addDays,
  caloriesFor,
  dateKey,
  mealsForDate,
  nutrientFor,
  startOfDay,
  startOfWeek,
} from '../../meals/mealUtils';
import type { Meal } from '../../meals/mealTypes';
import { useAuth } from '../../../providers/AuthProvider';

export function useDashboardNutrition() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealImageUrls, setMealImageUrls] = useState<Record<string, string>>({});
  const [targets, setTargets] = useState<NutritionTargets>({ calories: null, protein: null });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    const weekStart = startOfWeek(new Date());

    try {
      const [mealResult, targetResult] = await Promise.all([
        getMealsBetween(user.id, weekStart, addDays(weekStart, 7)),
        getNutritionTargets(user.id),
      ]);
      setMeals(mealResult.meals);
      setMealImageUrls(mealResult.imageUrls);
      setTargets(targetResult);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Dashboard nutrition could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today);
  const todayMeals = mealsForDate(meals, today);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      calories: caloriesFor(mealsForDate(meals, date)),
      date,
      isToday: dateKey(date) === dateKey(today),
      key: dateKey(date),
    };
  });

  return {
    days,
    isLoading,
    loadError,
    maximumCalories: Math.max(...days.map((day) => day.calories), 1),
    mealImageUrls,
    meals: todayMeals,
    refresh: loadDashboard,
    targets,
    totals: {
      calories: caloriesFor(todayMeals),
      carbs: nutrientFor(todayMeals, 'carbs_g'),
      fat: nutrientFor(todayMeals, 'fat_g'),
      protein: nutrientFor(todayMeals, 'protein_g'),
    },
  };
}
