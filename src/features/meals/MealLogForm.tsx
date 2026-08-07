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

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { analyzeMealPhoto, type MealAnalysis } from './mealAnalysis';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

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

const optionalNumber = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const storagePathFor = (userId: string, file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const token =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${userId}/${token}.${extension}`;
};

export function MealLogForm({ userId, onSaved, showHeader = true }: MealLogFormProps) {
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
      setAiAnalysis(null);
      setFeedback(null);
    };
    input.click();
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

  const analyzePhoto = async () => {
    if (!selectedImage) {
      setFeedback({ kind: 'error', text: 'Add a meal photo before asking AI to analyze it.' });
      return;
    }

    setIsAnalyzing(true);
    setFeedback(null);
    try {
      const analysis = await analyzeMealPhoto(selectedImage.file, description, serving);
      setAiAnalysis(analysis);
      setName(analysis.meal_name);
      setServing(analysis.serving);
      setCalories(String(analysis.estimated_calories));
      setProtein(String(analysis.protein_g));
      setCarbs(String(analysis.carbs_g));
      setFat(String(analysis.fat_g));
      setFeedback({
        kind: 'success',
        text: 'AI estimate ready. Review and adjust the portions or nutrition before saving.',
      });
    } catch (error) {
      setAiAnalysis(null);
      setFeedback({
        kind: 'error',
        text: error instanceof Error ? error.message : 'The meal could not be analyzed.',
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

    const source = selectedImage
      ? description.trim()
        ? 'photo_and_description'
        : 'photo'
      : description.trim()
        ? 'description'
        : 'manual';
    const imagePath = selectedImage ? storagePathFor(userId, selectedImage.file) : null;

    try {
      if (imagePath && selectedImage) {
        const { error: uploadError } = await supabase?.storage.from('meal-images').upload(imagePath, selectedImage.file, {
          cacheControl: '3600',
          contentType: selectedImage.file.type,
          upsert: false,
        }) ?? { error: new Error('Supabase is not configured.') };

        if (uploadError) {
          setFeedback({ kind: 'error', text: `Photo upload failed: ${uploadError.message}` });
          return;
        }
      }

      const { data: savedMeal, error } = await supabase?.from('meals').insert({
        user_id: userId,
        name: name.trim(),
        source,
        description: description.trim() || null,
        image_path: imagePath,
        estimated_calories: calorieValue === null ? null : Math.round(calorieValue),
        protein_g: proteinValue,
        carbs_g: carbsValue,
        fat_g: fatValue,
        confidence_score: aiAnalysis?.confidence_score ?? null,
        is_user_confirmed: true,
        analysis_metadata: {
          meal_type: mealType,
          serving: serving.trim() || null,
          ai_analysis: aiAnalysis ? {
            provider: aiAnalysis.provider,
            model: aiAnalysis.model,
            analyzed_at: aiAnalysis.analyzed_at,
            assumptions: aiAnalysis.assumptions,
            warnings: aiAnalysis.warnings,
            original_estimate: {
              name: aiAnalysis.meal_name,
              serving: aiAnalysis.serving,
              calories: aiAnalysis.estimated_calories,
              protein_g: aiAnalysis.protein_g,
              carbs_g: aiAnalysis.carbs_g,
              fat_g: aiAnalysis.fat_g,
            },
          } : null,
        },
      }).select('id').single() ?? { data: null, error: new Error('Supabase is not configured.') };

      if (error) {
        if (imagePath) await supabase?.storage.from('meal-images').remove([imagePath]);
        setFeedback({ kind: 'error', text: error.message });
        return;
      }

      if (savedMeal && aiAnalysis?.items.length) {
        const { error: itemError } = await supabase?.from('meal_items').insert(
          aiAnalysis.items.map((item, index) => ({
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
        ) ?? { error: new Error('Supabase is not configured.') };

        if (itemError) {
          await supabase?.from('meals').delete().eq('id', savedMeal.id);
          if (imagePath) await supabase?.storage.from('meal-images').remove([imagePath]);
          setFeedback({ kind: 'error', text: `Meal items could not be saved: ${itemError.message}` });
          return;
        }
      }

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
      setFeedback({ kind: 'success', text: 'Meal added to Today.' });
      onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {showHeader ? (
        <>
          <Text style={styles.title}>Log a meal</Text>
          <Text style={styles.subtitle}>Capture the dish, portion, nutrition, and a photo if you have one.</Text>
        </>
      ) : null}

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

      <Text style={styles.fieldLabel}>Quick add a dish</Text>
      <View style={styles.quickDishRow}>
        {quickDishes.map((dish) => (
          <Pressable key={dish.name} onPress={() => applyQuickDish(dish)} style={styles.quickDish}>
            <Text style={styles.quickDishText}>{dish.name}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        onChangeText={setName}
        placeholder="Dish or meal name"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={name}
      />
      <TextInput
        onChangeText={setDescription}
        multiline
        placeholder="What was in it? Add ingredients, sauces, or notes"
        placeholderTextColor={colors.muted}
        style={[styles.input, styles.descriptionInput]}
        value={description}
      />

      <View style={styles.row}>
        <TextInput
          onChangeText={setServing}
          placeholder="Serving (e.g. 1 bowl)"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.halfInput]}
          value={serving}
        />
        <Pressable disabled={isAnalyzing} onPress={chooseImage} style={styles.photoButton}>
          <Text style={styles.photoButtonText}>{selectedImage ? 'Change photo' : 'Add photo'}</Text>
        </Pressable>
      </View>

      {selectedImage ? (
        <View style={styles.photoPreviewRow}>
          <Image source={{ uri: selectedImage.previewUrl }} style={styles.photoPreview} />
          <View style={styles.photoPreviewInfo}>
            <Text style={styles.photoName} numberOfLines={1}>{selectedImage.file.name}</Text>
            <Pressable onPress={() => {
              setSelectedImage(null);
              setAiAnalysis(null);
            }}>
              <Text style={styles.removePhoto}>Remove photo</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {selectedImage ? (
        <>
          <Pressable
            disabled={isAnalyzing || isSaving}
            onPress={() => void analyzePhoto()}
            style={({ pressed }) => [styles.aiButton, pressed && styles.pressed]}
          >
            {isAnalyzing ? (
              <View style={styles.aiButtonContent}>
                <ActivityIndicator color={colors.primaryDark} size="small" />
                <Text style={styles.aiButtonText}>Analyzing meal…</Text>
              </View>
            ) : (
              <Text style={styles.aiButtonText}>{aiAnalysis ? 'Analyze photo again' : 'Estimate nutrition with AI'}</Text>
            )}
          </Pressable>
          <Text style={styles.aiPrivacyNote}>Your photo and notes are sent to Google Gemini for this estimate.</Text>
        </>
      ) : null}

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
          <Text style={styles.aiDisclaimer}>Photo-based nutrition is approximate. Edit anything that looks wrong.</Text>
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Nutrition <Text style={styles.optional}>(optional)</Text></Text>
      <View style={styles.row}>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setCalories}
          placeholder="Calories"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.quarterInput]}
          value={calories}
        />
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setProtein}
          placeholder="Protein g"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.quarterInput]}
          value={protein}
        />
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setCarbs}
          placeholder="Carbs g"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.quarterInput]}
          value={carbs}
        />
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setFat}
          placeholder="Fat g"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.quarterInput]}
          value={fat}
        />
      </View>

      {feedback ? <Text style={feedback.kind === 'error' ? styles.error : styles.success}>{feedback.text}</Text> : null}
      <Pressable
        disabled={isSaving || isAnalyzing}
        onPress={() => void saveMeal()}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        {isSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Add meal</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surfaceMuted, borderRadius: 18, marginTop: 24, padding: 18 },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 17 },
  optional: { color: colors.muted, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  selectedChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  selectedChipText: { color: colors.white },
  quickDishRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  quickDish: { backgroundColor: '#E0F0E5', borderRadius: 10, maxWidth: '48%', paddingHorizontal: 11, paddingVertical: 9 },
  quickDishText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 15, marginTop: 12, minWidth: 0, paddingHorizontal: 14, paddingVertical: 13 },
  row: { flexDirection: 'row', gap: 9 },
  halfInput: { flex: 1 },
  quarterInput: { flex: 1, paddingHorizontal: 9 },
  descriptionInput: { minHeight: 76, textAlignVertical: 'top' },
  photoButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: 12, justifyContent: 'center', marginTop: 12, minWidth: 112, paddingHorizontal: 12 },
  photoButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  photoPreviewRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', marginTop: 12, padding: 8 },
  photoPreview: { borderRadius: 8, height: 64, width: 64 },
  photoPreviewInfo: { flex: 1, marginLeft: 10 },
  photoName: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  removePhoto: { color: colors.danger, fontSize: 12, fontWeight: '700', marginTop: 6 },
  aiButton: { alignItems: 'center', backgroundColor: '#E0F0E5', borderColor: colors.primary, borderRadius: 12, borderWidth: 1, justifyContent: 'center', marginTop: 10, minHeight: 46, paddingHorizontal: 14 },
  aiButtonContent: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  aiButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  aiPrivacyNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5, textAlign: 'center' },
  aiResult: { backgroundColor: colors.surface, borderColor: colors.primary, borderRadius: 12, borderWidth: 1, marginTop: 10, padding: 13 },
  aiResultHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  aiResultTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  confidence: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  aiItem: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  aiNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  aiDisclaimer: { color: colors.danger, fontSize: 11, fontWeight: '700', lineHeight: 16, marginTop: 8 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: 10 },
  success: { color: colors.primaryDark, fontSize: 13, lineHeight: 19, marginTop: 10 },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', marginTop: 14, minHeight: 46 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
