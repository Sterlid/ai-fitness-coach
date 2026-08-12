import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../../providers/AuthProvider';
import type { Meal } from '../mealTypes';
import {
  deleteMeal,
  getMealById,
  updateMeal,
  type UpdateMealInput,
} from '../services/mealService';

export function useMealDetail(mealId: string | null) {
  const { user } = useAuth();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMeal = useCallback(async () => {
    if (!user || !mealId) {
      setIsLoading(false);
      setLoadError('This meal could not be found.');
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getMealById(user.id, mealId);
      setMeal(result.meal);
      setImageUrl(result.imageUrl);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'This meal could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [mealId, user]);

  useEffect(() => {
    void loadMeal();
  }, [loadMeal]);

  const save = async (values: Omit<UpdateMealInput, 'mealId' | 'userId'>) => {
    if (!user || !mealId) throw new Error('This meal could not be found.');
    setIsSaving(true);
    try {
      await updateMeal({ ...values, mealId, userId: user.id });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!user || !mealId || !meal) throw new Error('This meal could not be found.');
    setIsDeleting(true);
    try {
      await deleteMeal(user.id, mealId, meal.image_path);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    imageUrl,
    isDeleting,
    isLoading,
    isSaving,
    loadError,
    meal,
    refresh: loadMeal,
    remove,
    save,
  };
}
