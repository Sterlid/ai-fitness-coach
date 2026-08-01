export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationship[];
};

type Timestamps = { created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        Timestamps & {
          id: string; display_name: string | null; units_system: string; timezone: string;
          birth_year: number | null; height_cm: number | null; current_weight_kg: number | null;
          onboarding_completed: boolean;
        },
        { id: string; display_name?: string | null; units_system?: string; timezone?: string; birth_year?: number | null; height_cm?: number | null; current_weight_kg?: number | null; onboarding_completed?: boolean }
      >;
      user_goals: Table<
        Timestamps & { id: string; user_id: string; goal_type: Database['public']['Enums']['goal_type']; target_weight_kg: number | null; daily_calorie_target: number | null; daily_protein_target_g: number | null; starts_on: string; ends_on: string | null; is_active: boolean },
        { id?: string; user_id: string; goal_type: Database['public']['Enums']['goal_type']; target_weight_kg?: number | null; daily_calorie_target?: number | null; daily_protein_target_g?: number | null; starts_on?: string; ends_on?: string | null; is_active?: boolean }
      >;
      food_preferences: Table<
        Timestamps & { user_id: string; dietary_patterns: string[]; allergies: string[]; disliked_foods: string[]; preferred_cuisines: string[]; available_equipment: string[]; workout_limitations: string[]; training_experience: string | null; preferred_workout_minutes: number | null },
        { user_id: string; dietary_patterns?: string[]; allergies?: string[]; disliked_foods?: string[]; preferred_cuisines?: string[]; available_equipment?: string[]; workout_limitations?: string[]; training_experience?: string | null; preferred_workout_minutes?: number | null }
      >;
      daily_targets: Table<
        Timestamps & { id: string; user_id: string; target_date: string; calorie_target: number | null; protein_target_g: number | null; carbs_target_g: number | null; fat_target_g: number | null; source: string },
        { id?: string; user_id: string; target_date: string; calorie_target?: number | null; protein_target_g?: number | null; carbs_target_g?: number | null; fat_target_g?: number | null; source?: string }
      >;
      meals: Table<
        Timestamps & { id: string; user_id: string; eaten_at: string; name: string | null; source: Database['public']['Enums']['meal_source']; description: string | null; image_path: string | null; estimated_calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; confidence_score: number | null; is_user_confirmed: boolean; analysis_metadata: Json },
        { id?: string; user_id: string; eaten_at?: string; name?: string | null; source: Database['public']['Enums']['meal_source']; description?: string | null; image_path?: string | null; estimated_calories?: number | null; protein_g?: number | null; carbs_g?: number | null; fat_g?: number | null; confidence_score?: number | null; is_user_confirmed?: boolean; analysis_metadata?: Json }
      >;
      meal_items: Table<
        Timestamps & { id: string; meal_id: string; name: string; quantity: number | null; unit: string | null; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; confidence_score: number | null; sort_order: number },
        { id?: string; meal_id: string; name: string; quantity?: number | null; unit?: string | null; calories?: number | null; protein_g?: number | null; carbs_g?: number | null; fat_g?: number | null; confidence_score?: number | null; sort_order?: number }
      >;
      meal_recommendations: Table<
        Timestamps & { id: string; user_id: string; recommended_for: string; title: string; rationale: string; estimated_calories: number | null; protein_g: number | null; ingredients: Json; instructions: Json; status: Database['public']['Enums']['recommendation_status']; model_metadata: Json },
        { id?: string; user_id: string; recommended_for?: string; title: string; rationale: string; estimated_calories?: number | null; protein_g?: number | null; ingredients?: Json; instructions?: Json; status?: Database['public']['Enums']['recommendation_status']; model_metadata?: Json }
      >;
      workouts: Table<
        Timestamps & { id: string; user_id: string; scheduled_for: string; title: string; rationale: string | null; duration_minutes: number | null; intensity: string | null; equipment: string[]; status: Database['public']['Enums']['workout_status']; perceived_difficulty: number | null; soreness_notes: string | null; pain_reported: boolean; model_metadata: Json },
        { id?: string; user_id: string; scheduled_for?: string; title: string; rationale?: string | null; duration_minutes?: number | null; intensity?: string | null; equipment?: string[]; status?: Database['public']['Enums']['workout_status']; perceived_difficulty?: number | null; soreness_notes?: string | null; pain_reported?: boolean; model_metadata?: Json }
      >;
      workout_exercises: Table<
        Timestamps & { id: string; workout_id: string; name: string; sets: number | null; reps: string | null; duration_seconds: number | null; rest_seconds: number | null; instructions: string | null; muscle_groups: string[]; sort_order: number; completed: boolean },
        { id?: string; workout_id: string; name: string; sets?: number | null; reps?: string | null; duration_seconds?: number | null; rest_seconds?: number | null; instructions?: string | null; muscle_groups?: string[]; sort_order?: number; completed?: boolean }
      >;
      body_measurements: Table<
        Timestamps & { id: string; user_id: string; measured_at: string; weight_kg: number | null; body_fat_percent: number | null; notes: string | null },
        { id?: string; user_id: string; measured_at?: string; weight_kg?: number | null; body_fat_percent?: number | null; notes?: string | null }
      >;
      feedback_events: Table<
        { id: string; user_id: string; created_at: string; event_type: Database['public']['Enums']['feedback_type']; entity_type: string; entity_id: string | null; rating: number | null; reason: string | null; context: Json },
        { id?: string; user_id: string; event_type: Database['public']['Enums']['feedback_type']; entity_type: string; entity_id?: string | null; rating?: number | null; reason?: string | null; context?: Json }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      goal_type: 'general_wellness' | 'fat_loss' | 'maintenance' | 'muscle_gain' | 'performance';
      meal_source: 'photo' | 'description' | 'photo_and_description' | 'manual';
      recommendation_status: 'suggested' | 'saved' | 'accepted' | 'dismissed';
      workout_status: 'planned' | 'in_progress' | 'completed' | 'skipped';
      feedback_type: 'positive' | 'negative' | 'correction' | 'skip' | 'difficulty' | 'pain';
    };
    CompositeTypes: Record<string, never>;
  };
};

