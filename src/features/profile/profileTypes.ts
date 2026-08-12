import type { Database } from '../../types/database';

export type GoalType = Database['public']['Enums']['goal_type'];
export type UnitsSystem = 'metric' | 'imperial';

export type ProfileSettings = {
  displayName: string;
  units: UnitsSystem;
  heightCm: number | null;
  currentWeightKg: number | null;
  goalType: GoalType;
  targetWeightKg: number | null;
  calorieTarget: number | null;
  proteinTarget: number | null;
};

export type SaveProfileSettingsInput = ProfileSettings & {
  userId: string;
};
