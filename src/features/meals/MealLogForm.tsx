import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import { analyzeMeal, type MealAnalysis } from './mealAnalysis';
import type { MealType } from './mealTypes';
import { optionalNumber } from './mealUtils';
import { createMeal } from './services/mealService';

const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const quickDishes = [
  { name: 'Chicken rice bowl', calories: 550, protein: 38, carbs: 62, fat: 14 },
  { name: 'Greek yogurt and berries', calories: 280, protein: 22, carbs: 30, fat: 7 },
  { name: 'Oatmeal with banana', calories: 390, protein: 12, carbs: 67, fat: 10 },
  { name: 'Salmon with vegetables', calories: 520, protein: 40, carbs: 28, fat: 26 },
];

type MealLogFormProps = {
  userId: string;
  onSaved: () => void;
  showHeader?: boolean;
};

type SelectedImage = {
  file: File;
  previewUrl: string;
};

export function MealLogForm({ userId, onSaved, showHeader = true }: MealLogFormProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [mealType, setMealType] = useState<MealType>('Lunch');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serving, setServing] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<MealAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

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
      setShowDetails(true);
      setAiAnalysis(null);
      setFeedback(null);
    };
    input.click();
  };

  const removePhoto = () => {
    setSelectedImage(null);
    setAiAnalysis(null);
    setFeedback(null);
  };

  const applyQuickDish = (dish: (typeof quickDishes)[number]) => {
    setName(dish.name);
    setCalories(String(dish.calories));
    setProtein(String(dish.protein));
    setCarbs(String(dish.carbs));
    setFat(String(dish.fat));
    setAiAnalysis(null);
    setFeedback(null);
  };

  const estimateNutrition = async () => {
    if (!selectedImage && (!name.trim() || !serving.trim())) {
      setFeedback({ kind: 'error', text: 'Add a dish name and serving size before estimating nutrition.' });
      return;
    }

    setIsAnalyzing(true);
    setFeedback(null);
    try {
      const analysis = await analyzeMeal({
        description,
        dish: name,
        file: selectedImage?.file ?? null,
        serving,
      });
      setAiAnalysis(analysis);
      setName(analysis.meal_name || name);
      setServing(analysis.serving || serving);
      setCalories(String(analysis.estimated_calories));
      setProtein(String(analysis.protein_g));
      setCarbs(String(analysis.carbs_g));
      setFat(String(analysis.fat_g));
      setFeedback({
        kind: 'success',
        text: 'AI estimate ready. Review and adjust the meal before saving.',
      });
    } catch (error) {
      setAiAnalysis(null);
      setFeedback({
        kind: 'error',
        text: error instanceof Error ? error.message : 'The meal could not be estimated.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    const calorieValue = optionalNumber(calories);
    const proteinValue = optionalNumber(protein);
    const carbsValue = optionalNumber(carbs);
    const fatValue = optionalNumber(fat);

    if (!name.trim()) {
      setFeedback({ kind: 'error', text: 'Add the name of the dish or meal.' });
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

    setIsSaving(true);
    setFeedback(null);

    try {
      await createMeal({
        aiAnalysis,
        calories: calorieValue,
        carbs: carbsValue,
        description,
        fat: fatValue,
        imageFile: selectedImage?.file ?? null,
        mealType,
        name,
        protein: proteinValue,
        serving,
        userId,
      });

      setShowDetails(false);
      setMealType('Lunch');
      setName('');
      setDescription('');
      setServing('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setSelectedImage(null);
      setAiAnalysis(null);
      onSaved();
    } catch (error) {
      setFeedback({
        kind: 'error',
        text: error instanceof Error ? error.message : 'The meal could not be saved.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {showHeader ? (
        <>
          <Text style={styles.title}>Add meal</Text>
          <Text style={styles.subtitle}>Start with a photo, or enter the meal details yourself.</Text>
        </>
      ) : null}

      <View style={styles.photoCard}>
        <Pressable
          accessibilityLabel={selectedImage ? 'Replace meal photo' : 'Add meal photo'}
          accessibilityRole="button"
          disabled={isAnalyzing || isSaving}
          onPress={chooseImage}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {selectedImage ? (
            <Image source={{ uri: selectedImage.previewUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>+</Text>
              <Text style={styles.photoPlaceholderTitle}>Add a meal photo</Text>
              <Text style={styles.photoPlaceholderText}>JPEG, PNG, or WebP up to 8 MB</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.photoActions}>
          <Pressable
            disabled={isAnalyzing || isSaving}
            onPress={chooseImage}
            style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}
          >
            <Text style={styles.photoButtonText}>{selectedImage ? 'Replace photo' : 'Add photo'}</Text>
          </Pressable>
          {selectedImage ? (
            <Pressable disabled={isAnalyzing || isSaving} onPress={removePhoto} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.removePhotoText}>Remove</Text>
            </Pressable>
          ) : (
            <Text style={styles.photoActionHint}>Use a photo for a quicker estimate</Text>
          )}
        </View>
      </View>

      {!showDetails ? (
        <View style={styles.manualChoice}>
          <Text style={styles.manualChoiceText}>No photo? You can still estimate a meal from its details.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setShowDetails(true);
              setFeedback(null);
            }}
            style={({ pressed }) => [styles.manualButton, pressed && styles.pressed]}
          >
            <Text style={styles.manualButtonText}>Add manually</Text>
          </Pressable>
        </View>
      ) : (
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
            <Text style={styles.fieldLabel}>Quick add a dish</Text>
            <View style={styles.quickDishRow}>
              {quickDishes.map((dish) => (
                <Pressable key={dish.name} onPress={() => applyQuickDish(dish)} style={styles.quickDish}>
                  <Text style={styles.quickDishText}>{dish.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Dish name</Text>
            <TextInput
              onChangeText={setName}
              placeholder="e.g. Chicken rice"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={name}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              multiline
              onChangeText={setDescription}
              placeholder="Ingredients, sauces, or how it was prepared"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.descriptionInput]}
              value={description}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Serving size</Text>
            <TextInput
              onChangeText={setServing}
              placeholder="e.g. 1 bowl, 250 g, or 2 slices"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={serving}
            />
          </View>

          <View style={styles.estimateCard}>
            <Text style={styles.estimateTitle}>Estimate nutrition with AI</Text>
            <Text style={styles.estimateDescription}>
              {selectedImage
                ? 'Gemini will use the photo and any details you provide.'
                : 'Enter a dish name and serving size. More detail gives a better estimate.'}
            </Text>
            <Pressable
              disabled={isAnalyzing || isSaving}
              onPress={() => void estimateNutrition()}
              style={({ pressed }) => [styles.aiButton, pressed && styles.pressed]}
            >
              {isAnalyzing ? (
                <View style={styles.aiButtonContent}>
                  <ActivityIndicator color={colors.primaryDark} size="small" />
                  <Text style={styles.aiButtonText}>Estimating meal…</Text>
                </View>
              ) : (
                <Text style={styles.aiButtonText}>{aiAnalysis ? 'Estimate again' : 'Estimate nutrition'}</Text>
              )}
            </Pressable>
            <Text style={styles.aiPrivacyNote}>
              {selectedImage ? 'Your photo and meal details' : 'Your meal details'} are sent to Google Gemini for this estimate.
            </Text>
          </View>

          {aiAnalysis ? (
            <View style={styles.aiResult}>
              <View style={styles.aiResultHeader}>
                <Text style={styles.aiResultTitle}>Gemini estimate</Text>
                <Text style={styles.confidence}>{aiAnalysis.confidence_score}% confidence</Text>
              </View>
              {aiAnalysis.items.map((item, index) => (
                <Text key={`${item.name}-${index}`} style={styles.aiItem}>
                  • {item.name}{item.quantity ? ` — ${item.quantity} ${item.unit}` : ''} ({item.calories} kcal)
                </Text>
              ))}
              {[...aiAnalysis.assumptions, ...aiAnalysis.warnings].map((note, index) => (
                <Text key={`${note}-${index}`} style={styles.aiNote}>Check: {note}</Text>
              ))}
              <Text style={styles.aiDisclaimer}>AI nutrition estimates are approximate. Edit anything that looks wrong.</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nutrition <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.nutritionGrid}>
              <NutritionField label="Calories" onChange={setCalories} unit="kcal" value={calories} />
              <NutritionField label="Protein" onChange={setProtein} unit="g" value={protein} />
              <NutritionField label="Carbs" onChange={setCarbs} unit="g" value={carbs} />
              <NutritionField label="Fat" onChange={setFat} unit="g" value={fat} />
            </View>
          </View>

          {feedback ? <Text style={feedback.kind === 'error' ? styles.error : styles.success}>{feedback.text}</Text> : null}
          <Pressable
            disabled={isSaving || isAnalyzing}
            onPress={() => void saveMeal()}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            {isSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveButtonText}>Add meal</Text>}
          </Pressable>
        </View>
      )}

      {!showDetails && feedback ? (
        <Text style={feedback.kind === 'error' ? styles.error : styles.success}>{feedback.text}</Text>
      ) : null}
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

const styles = StyleSheet.create({
  container: { marginTop: 22 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  photoCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  photo: { height: 210, width: '100%' },
  photoPlaceholder: { alignItems: 'center', backgroundColor: colors.surfaceMuted, height: 190, justifyContent: 'center' },
  photoPlaceholderIcon: { color: colors.primary, fontSize: 32, fontWeight: '700' },
  photoPlaceholderTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 7 },
  photoPlaceholderText: { color: colors.muted, fontSize: 12, marginTop: 5 },
  photoActions: { alignItems: 'center', flexDirection: 'row', gap: 14, padding: 13 },
  photoButton: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  photoButtonText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  photoActionHint: { color: colors.muted, flex: 1, fontSize: 11, lineHeight: 15 },
  removePhotoText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  manualChoice: { alignItems: 'center', marginTop: 20 },
  manualChoiceText: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  manualButton: { alignItems: 'center', borderColor: colors.primary, borderRadius: 12, borderWidth: 1, justifyContent: 'center', marginTop: 12, minHeight: 48, width: '100%' },
  manualButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  form: { gap: 20, marginTop: 24 },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  optional: { color: colors.muted, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  selectedChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  selectedChipText: { color: colors.white },
  quickDishRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickDish: { backgroundColor: '#E0F0E5', borderRadius: 10, maxWidth: '48%', paddingHorizontal: 11, paddingVertical: 9 },
  quickDishText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 50, paddingHorizontal: 14, paddingVertical: 13 },
  descriptionInput: { minHeight: 92, textAlignVertical: 'top' },
  estimateCard: { backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 14 },
  estimateTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  estimateDescription: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  aiButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.primary, borderRadius: 11, borderWidth: 1, justifyContent: 'center', marginTop: 12, minHeight: 46, paddingHorizontal: 14 },
  aiButtonContent: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  aiButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  aiPrivacyNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 7, textAlign: 'center' },
  aiResult: { backgroundColor: colors.surface, borderColor: colors.primary, borderRadius: 12, borderWidth: 1, padding: 13 },
  aiResultHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  aiResultTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  confidence: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  aiItem: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  aiNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  aiDisclaimer: { color: colors.danger, fontSize: 11, fontWeight: '700', lineHeight: 16, marginTop: 8 },
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
  pressed: { opacity: 0.78 },
});
