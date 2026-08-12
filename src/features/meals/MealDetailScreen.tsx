import { createElement, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BottomNavigation } from '../../navigation/BottomNavigation';
import { getMealRoute, navigateToMeals, navigateToPath } from '../../navigation/webRouter';
import { colors } from '../../theme/colors';
import { useMealDetail } from './hooks/useMealDetail';
import type { MealType } from './mealTypes';
import { mealMetadata, optionalNumber } from './mealUtils';

const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

type SelectedImage = {
  file: File;
  previewUrl: string;
};

function localDateTimeValue(isoValue: string) {
  const date = new Date(isoValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function validMealType(value: string | undefined): MealType {
  return mealTypes.includes(value as MealType) ? value as MealType : 'Lunch';
}

export function MealDetailScreen() {
  const route = getMealRoute();
  const { imageUrl, isDeleting, isLoading, isSaving, loadError, meal, refresh, remove, save } = useMealDetail(route?.id ?? null);
  const [mealType, setMealType] = useState<MealType>('Lunch');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serving, setServing] = useState('');
  const [eatenAt, setEatenAt] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const returnPath = route?.returnPath ?? '/meals';

  const leaveDetail = (replace = false) => {
    if (returnPath === '/home') {
      navigateToPath('/home', replace);
      return;
    }
    navigateToMeals(route?.mealsView ?? 'today', replace);
  };

  useEffect(() => {
    if (!meal) return;
    const metadata = mealMetadata(meal.analysis_metadata);
    setMealType(validMealType(metadata.meal_type));
    setName(meal.name ?? '');
    setDescription(meal.description ?? '');
    setServing(metadata.serving ?? '');
    setEatenAt(localDateTimeValue(meal.eaten_at));
    setCalories(meal.estimated_calories === null ? '' : String(meal.estimated_calories));
    setProtein(meal.protein_g === null ? '' : String(meal.protein_g));
    setCarbs(meal.carbs_g === null ? '' : String(meal.carbs_g));
    setFat(meal.fat_g === null ? '' : String(meal.fat_g));
    setRemoveImage(false);
    setFeedback(null);
  }, [meal]);

  useEffect(() => {
    return () => {
      if (selectedImage && Platform.OS === 'web') URL.revokeObjectURL(selectedImage.previewUrl);
    };
  }, [selectedImage]);

  const chooseImage = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      setFeedback({ kind: 'error', text: 'Photo selection is currently available in the web app.' });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        setFeedback({ kind: 'error', text: 'Choose an image smaller than 8 MB.' });
        return;
      }

      setSelectedImage((current) => {
        if (current) URL.revokeObjectURL(current.previewUrl);
        return { file, previewUrl: URL.createObjectURL(file) };
      });
      setRemoveImage(false);
      setFeedback(null);
    };
    input.click();
  };

  const clearPhoto = () => {
    setSelectedImage((current) => {
      if (current && Platform.OS === 'web') URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    setRemoveImage(true);
    setFeedback(null);
  };

  const saveChanges = async () => {
    if (!meal) return;
    const calorieValue = optionalNumber(calories);
    const proteinValue = optionalNumber(protein);
    const carbsValue = optionalNumber(carbs);
    const fatValue = optionalNumber(fat);
    const parsedDate = new Date(eatenAt);

    if (!name.trim()) {
      setFeedback({ kind: 'error', text: 'Add a name for this meal.' });
      return;
    }
    if (Number.isNaN(parsedDate.getTime())) {
      setFeedback({ kind: 'error', text: 'Enter a valid date and time.' });
      return;
    }
    if (
      calorieValue === undefined ||
      proteinValue === undefined ||
      carbsValue === undefined ||
      fatValue === undefined
    ) {
      setFeedback({ kind: 'error', text: 'Nutrition values must be zero or a positive number.' });
      return;
    }

    setFeedback(null);
    try {
      await save({
        calories: calorieValue,
        carbs: carbsValue,
        currentImagePath: meal.image_path,
        description,
        eatenAt: parsedDate.toISOString(),
        fat: fatValue,
        imageFile: selectedImage?.file ?? null,
        mealType,
        name,
        protein: proteinValue,
        removeImage,
        serving,
      });
      leaveDetail(true);
    } catch (error) {
      setFeedback({
        kind: 'error',
        text: error instanceof Error ? error.message : 'The meal could not be updated.',
      });
    }
  };

  const deleteConfirmed = async () => {
    setFeedback(null);
    try {
      await remove();
      leaveDetail(true);
    } catch (error) {
      setFeedback({
        kind: 'error',
        text: error instanceof Error ? error.message : 'The meal could not be deleted.',
      });
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Delete this meal? This cannot be undone.')) void deleteConfirmed();
      return;
    }

    Alert.alert('Delete meal?', 'This cannot be undone.', [
      { style: 'cancel', text: 'Cancel' },
      { onPress: () => void deleteConfirmed(), style: 'destructive', text: 'Delete' },
    ]);
  };

  const displayedImage = selectedImage?.previewUrl ?? (!removeImage ? imageUrl : null);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} style={styles.scroll}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => leaveDetail()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading meal…</Text>
          </View>
        ) : null}

        {!isLoading && loadError ? (
          <View style={styles.stateCard}>
            <Text style={styles.error}>{loadError}</Text>
            <Pressable onPress={() => void refresh()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !loadError && meal ? (
          <>
            <Text style={styles.eyebrow}>MEAL DETAILS</Text>
            <Text style={styles.title}>Edit meal</Text>
            <Text style={styles.subtitle}>Correct the meal information or nutrition estimate.</Text>

            <View style={styles.photoCard}>
              {displayedImage ? (
                <Image source={{ uri: displayedImage }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>+</Text>
                  <Text style={styles.photoPlaceholderText}>No meal photo</Text>
                </View>
              )}
              <View style={styles.photoActions}>
                <Pressable onPress={chooseImage} style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}>
                  <Text style={styles.photoButtonText}>{displayedImage ? 'Replace photo' : 'Add photo'}</Text>
                </Pressable>
                {displayedImage ? (
                  <Pressable onPress={clearPhoto} style={({ pressed }) => pressed && styles.pressed}>
                    <Text style={styles.removePhotoText}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Meal type</Text>
                <View style={styles.chipRow}>
                  {mealTypes.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setMealType(type)}
                      style={[styles.chip, mealType === type && styles.selectedChip]}
                    >
                      <Text style={[styles.chipText, mealType === type && styles.selectedChipText]}>{type}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Meal name</Text>
                <TextInput
                  onChangeText={setName}
                  placeholder="Meal name"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={name}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  multiline
                  onChangeText={setDescription}
                  placeholder="Ingredients, sauces, or notes"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.descriptionInput]}
                  value={description}
                />
              </View>

              <View style={styles.twoColumnRow}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Serving</Text>
                  <TextInput
                    onChangeText={setServing}
                    placeholder="1 bowl"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={serving}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Date and time</Text>
                  <DateTimeField onChange={setEatenAt} value={eatenAt} />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nutrition</Text>
                <View style={styles.nutritionGrid}>
                  <NutritionField label="Calories" onChange={setCalories} unit="kcal" value={calories} />
                  <NutritionField label="Protein" onChange={setProtein} unit="g" value={protein} />
                  <NutritionField label="Carbs" onChange={setCarbs} unit="g" value={carbs} />
                  <NutritionField label="Fat" onChange={setFat} unit="g" value={fat} />
                </View>
              </View>

              {feedback ? <Text style={feedback.kind === 'error' ? styles.error : styles.success}>{feedback.text}</Text> : null}

              <Pressable
                disabled={isSaving || isDeleting}
                onPress={() => void saveChanges()}
                style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
              >
                {isSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveButtonText}>Save changes</Text>}
              </Pressable>

              <Pressable
                disabled={isSaving || isDeleting}
                onPress={confirmDelete}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
              >
                {isDeleting ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.deleteButtonText}>Delete meal</Text>}
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
      <BottomNavigation active={returnPath === '/home' ? 'home' : 'meals'} />
    </View>
  );
}

type NutritionFieldProps = {
  label: string;
  onChange: (value: string) => void;
  unit: string;
  value: string;
};

function NutritionField({ label, onChange, unit, value }: NutritionFieldProps) {
  return (
    <View style={styles.nutritionField}>
      <Text style={styles.nutritionLabel}>{label}</Text>
      <View style={styles.nutritionInputWrap}>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={colors.muted}
          style={styles.nutritionInput}
          value={value}
        />
        <Text style={styles.nutritionUnit}>{unit}</Text>
      </View>
    </View>
  );
}

type DateTimeFieldProps = {
  onChange: (value: string) => void;
  value: string;
};

function DateTimeField({ onChange, value }: DateTimeFieldProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.dateTimeField}>
        {createDateTimeInput(onChange, value)}
      </View>
    );
  }

  return (
    <TextInput
      onChangeText={onChange}
      placeholder="YYYY-MM-DDTHH:mm"
      placeholderTextColor={colors.muted}
      style={styles.input}
      value={value}
    />
  );
}

function createDateTimeInput(onChange: (value: string) => void, value: string) {
  return createElement('input', {
    'aria-label': 'Date and time eaten',
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    style: webDateTimeInputStyle,
    type: 'datetime-local',
    value,
  });
}

const webDateTimeInputStyle = {
  backgroundColor: 'transparent',
  border: 0,
  boxSizing: 'border-box' as const,
  color: colors.ink,
  fontFamily: 'inherit',
  fontSize: 14,
  height: '100%',
  outline: 'none',
  padding: '0 12px',
  width: '100%',
};

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  scroll: { flex: 1 },
  container: { alignSelf: 'center', maxWidth: 640, padding: 24, paddingBottom: 116, width: '100%' },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 8, paddingVertical: 6 },
  backArrow: { color: colors.primaryDark, fontSize: 28, lineHeight: 30 },
  backLabel: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 22 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800', marginTop: 7 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  stateCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: 12, marginTop: 24, padding: 28 },
  stateText: { color: colors.muted, fontSize: 14 },
  retryButton: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  retryButtonText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  photoCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 22, overflow: 'hidden' },
  photo: { height: 210, width: '100%' },
  photoPlaceholder: { alignItems: 'center', backgroundColor: colors.surfaceMuted, height: 150, justifyContent: 'center' },
  photoPlaceholderIcon: { color: colors.primary, fontSize: 30, fontWeight: '700' },
  photoPlaceholderText: { color: colors.muted, fontSize: 13, marginTop: 5 },
  photoActions: { alignItems: 'center', flexDirection: 'row', gap: 16, padding: 13 },
  photoButton: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  photoButtonText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  removePhotoText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  form: { gap: 20, marginTop: 24 },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 50, paddingHorizontal: 14, paddingVertical: 13 },
  descriptionInput: { minHeight: 92, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  selectedChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  selectedChipText: { color: colors.white },
  twoColumnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  halfField: { flexBasis: 160, flexGrow: 1, gap: 8 },
  dateTimeField: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: 50, overflow: 'hidden' },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nutritionField: { flexBasis: '47%', flexGrow: 1, gap: 6 },
  nutritionLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  nutritionInputWrap: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row' },
  nutritionInput: { color: colors.ink, flex: 1, fontSize: 15, minHeight: 48, paddingHorizontal: 12, paddingVertical: 12 },
  nutritionUnit: { color: colors.muted, fontSize: 11, paddingRight: 12 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  success: { color: colors.primaryDark, fontSize: 13, lineHeight: 19 },
  saveButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 13, justifyContent: 'center', minHeight: 52 },
  saveButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  deleteButton: { alignItems: 'center', borderColor: '#F2C7C1', borderRadius: 13, borderWidth: 1, justifyContent: 'center', minHeight: 50 },
  deleteButtonText: { color: colors.danger, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.78 },
});
