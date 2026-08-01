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

export function MealLogForm({ userId, onSaved }: MealLogFormProps) {
  const [mealType, setMealType] = useState<MealType>('Lunch');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serving, setServing] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
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
      if (file.size > 10 * 1024 * 1024) {
        setFeedback({ kind: 'error', text: 'Choose an image smaller than 10 MB.' });
        return;
      }

      setSelectedImage((current) => {
        if (current) URL.revokeObjectURL(current.previewUrl);
        return { file, previewUrl: URL.createObjectURL(file) };
      });
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
    setFeedback(null);
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

      const { error } = await supabase?.from('meals').insert({
        user_id: userId,
        name: name.trim(),
        source,
        description: description.trim() || null,
        image_path: imagePath,
        estimated_calories: calorieValue === null ? null : Math.round(calorieValue),
        protein_g: proteinValue,
        carbs_g: carbsValue,
        fat_g: fatValue,
        is_user_confirmed: true,
        analysis_metadata: {
          meal_type: mealType,
          serving: serving.trim() || null,
        },
      }) ?? { error: new Error('Supabase is not configured.') };

      if (error) {
        if (imagePath) await supabase?.storage.from('meal-images').remove([imagePath]);
        setFeedback({ kind: 'error', text: error.message });
        return;
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
      setFeedback({ kind: 'success', text: 'Meal added to Today.' });
      onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log a meal</Text>
      <Text style={styles.subtitle}>Capture the dish, portion, nutrition, and a photo if you have one.</Text>

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
        <Pressable onPress={chooseImage} style={styles.photoButton}>
          <Text style={styles.photoButtonText}>{selectedImage ? 'Change photo' : 'Add photo'}</Text>
        </Pressable>
      </View>

      {selectedImage ? (
        <View style={styles.photoPreviewRow}>
          <Image source={{ uri: selectedImage.previewUrl }} style={styles.photoPreview} />
          <View style={styles.photoPreviewInfo}>
            <Text style={styles.photoName} numberOfLines={1}>{selectedImage.file.name}</Text>
            <Pressable onPress={() => setSelectedImage(null)}>
              <Text style={styles.removePhoto}>Remove photo</Text>
            </Pressable>
          </View>
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
        disabled={isSaving}
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
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: 10 },
  success: { color: colors.primaryDark, fontSize: 13, lineHeight: 19, marginTop: 10 },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', marginTop: 14, minHeight: 46 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
