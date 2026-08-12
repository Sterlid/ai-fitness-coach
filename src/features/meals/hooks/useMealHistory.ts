import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../../providers/AuthProvider';
import { getMealsBetween } from '../services/mealService';
import type { Meal } from '../mealTypes';
import {
  addDays,
  caloriesFor,
  dateKey,
  mealsForDate,
  nutrientFor,
  startOfDay,
  startOfWeek,
} from '../mealUtils';

export function useMealHistory() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealImageUrls, setMealImageUrls] = useState<Record<string, string>>({});
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMeals = useCallback(async () => {
    if (!user) {
      setIsLoadingMeals(false);
      return;
    }

    setIsLoadingMeals(true);
    setLoadError(null);

    try {
      const result = await getMealsBetween(user.id, weekStart, addDays(weekStart, 7));
      setMeals(result.meals);
      setMealImageUrls(result.imageUrls);
    } catch (error) {
      setMeals([]);
      setMealImageUrls({});
      setLoadError(error instanceof Error ? error.message : 'Meals could not be loaded.');
    } finally {
      setIsLoadingMeals(false);
    }
  }, [user, weekStart]);

  useEffect(() => {
    void loadMeals();
  }, [loadMeals]);

  const today = startOfDay(new Date());
  const currentWeekStart = startOfWeek(today);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const days = weekDays.map((date) => {
    const dayMeals = mealsForDate(meals, date);
    return {
      calories: caloriesFor(dayMeals),
      date,
      isSelected: dateKey(date) === dateKey(selectedDate),
      key: dateKey(date),
    };
  });
  const selectedMeals = mealsForDate(meals, selectedDate);
  const isCurrentWeek = dateKey(weekStart) === dateKey(currentWeekStart);

  const changeWeek = (offset: -1 | 1) => {
    if (offset === 1 && isCurrentWeek) return;
    const nextWeekStart = addDays(weekStart, offset * 7);
    setWeekStart(nextWeekStart);
    setSelectedDate(dateKey(nextWeekStart) === dateKey(currentWeekStart) ? today : nextWeekStart);
  };

  const weekEnd = addDays(weekStart, 6);

  return {
    days,
    isCurrentWeek,
    isLoadingMeals,
    loadError,
    maximumCalories: Math.max(...days.map((day) => day.calories), 1),
    mealImageUrls,
    nextWeek: () => changeWeek(1),
    previousWeek: () => changeWeek(-1),
    selectDate: setSelectedDate,
    selectedDateLabel: selectedDate.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      year: 'numeric',
    }),
    selectedMeals,
    totals: {
      calories: caloriesFor(selectedMeals),
      carbs: nutrientFor(selectedMeals, 'carbs_g'),
      fat: nutrientFor(selectedMeals, 'fat_g'),
      protein: nutrientFor(selectedMeals, 'protein_g'),
    },
    weekLabel: `${weekStart.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`,
  };
}
