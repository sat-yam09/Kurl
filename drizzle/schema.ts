import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  json,
  datetime,
  smallint
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User Profile - Personal fitness information
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  age: smallint("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  height: decimal("height", { precision: 5, scale: 2 }), // in cm
  fitnessLevel: mysqlEnum("fitnessLevel", ["beginner", "intermediate", "advanced", "elite"]).default("beginner"),
  primaryGoal: mysqlEnum("primaryGoal", ["weight_loss", "muscle_gain", "endurance", "strength", "general_fitness"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Exercise Library - 200+ exercises categorized by muscle group and equipment
 */
export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  muscleGroup: mysqlEnum("muscleGroup", [
    "chest", "back", "shoulders", "biceps", "triceps", "forearms",
    "legs", "quadriceps", "hamstrings", "glutes", "calves",
    "core", "abs", "obliques", "lower_back",
    "cardio", "stretching"
  ]).notNull(),
  equipment: mysqlEnum("equipment", [
    "barbell", "dumbbell", "kettlebell", "cable", "machine",
    "bodyweight", "resistance_band", "medicine_ball", "plate",
    "treadmill", "rowing_machine", "bike", "elliptical",
    "foam_roller", "none"
  ]).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate"),
  instructions: text("instructions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

/**
 * Workout Routines - Custom workout plans created by users
 */
export const workoutRoutines = mysqlTable("workoutRoutines", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  focusArea: mysqlEnum("focusArea", [
    "full_body", "upper_body", "lower_body", "push", "pull", "legs",
    "cardio", "flexibility", "custom"
  ]).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate"),
  durationMinutes: smallint("durationMinutes"),
  isTemplate: boolean("isTemplate").default(false), // true if it's a reusable template
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutRoutine = typeof workoutRoutines.$inferSelect;
export type InsertWorkoutRoutine = typeof workoutRoutines.$inferInsert;

/**
 * Routine Exercises - Exercises within a workout routine
 */
export const routineExercises = mysqlTable("routineExercises", {
  id: int("id").autoincrement().primaryKey(),
  routineId: int("routineId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  orderIndex: smallint("orderIndex").notNull(), // order in routine
  targetSets: smallint("targetSets"),
  targetReps: varchar("targetReps", { length: 50 }), // e.g., "8-12", "5", "10-15"
  restSeconds: smallint("restSeconds"), // rest time between sets
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoutineExercise = typeof routineExercises.$inferSelect;
export type InsertRoutineExercise = typeof routineExercises.$inferInsert;

/**
 * Workout Sessions - Individual workout logs
 */
export const workoutSessions = mysqlTable("workoutSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  routineId: int("routineId"), // reference to routine if based on one
  name: varchar("name", { length: 255 }).notNull(),
  focusArea: mysqlEnum("focusArea", [
    "full_body", "upper_body", "lower_body", "push", "pull", "legs",
    "cardio", "flexibility", "custom"
  ]).notNull(),
  startTime: datetime("startTime").notNull(),
  endTime: datetime("endTime"),
  durationMinutes: smallint("durationMinutes"),
  totalVolume: int("totalVolume"), // total weight x reps
  totalSets: smallint("totalSets"),
  totalReps: int("totalReps"),
  notes: text("notes"),
  mood: mysqlEnum("mood", ["great", "good", "okay", "bad", "terrible"]),
  energy: smallint("energy"), // 1-10 scale
  difficulty: mysqlEnum("difficulty", ["easy", "moderate", "hard", "very_hard"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = typeof workoutSessions.$inferInsert;

/**
 * Session Exercises - Individual exercise logs within a session
 */
export const sessionExercises = mysqlTable("sessionExercises", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  orderIndex: smallint("orderIndex").notNull(),
  sets: json("sets").notNull(), // Array of {reps, weight, duration, notes}
  totalVolume: int("totalVolume"), // weight x reps sum
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionExercise = typeof sessionExercises.$inferSelect;
export type InsertSessionExercise = typeof sessionExercises.$inferInsert;

/**
 * Fitness Goals - User-defined fitness objectives
 */
export const fitnessGoals = mysqlTable("fitnessGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  goalType: mysqlEnum("goalType", [
    "weight_loss", "muscle_gain", "strength", "endurance",
    "flexibility", "consistency", "custom"
  ]).notNull(),
  targetValue: decimal("targetValue", { precision: 8, scale: 2 }),
  currentValue: decimal("currentValue", { precision: 8, scale: 2 }),
  unit: varchar("unit", { length: 50 }), // kg, lbs, sets, reps, etc.
  startDate: datetime("startDate").notNull(),
  targetDate: datetime("targetDate"),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active"),
  progress: smallint("progress").default(0), // 0-100 percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FitnessGoal = typeof fitnessGoals.$inferSelect;
export type InsertFitnessGoal = typeof fitnessGoals.$inferInsert;

/**
 * Body Metrics - Track weight, measurements over time
 */
export const bodyMetrics = mysqlTable("bodyMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }), // kg
  bodyFatPercentage: decimal("bodyFatPercentage", { precision: 5, scale: 2 }),
  chestMeasurement: decimal("chestMeasurement", { precision: 5, scale: 2 }), // cm
  waistMeasurement: decimal("waistMeasurement", { precision: 5, scale: 2 }),
  hipMeasurement: decimal("hipMeasurement", { precision: 5, scale: 2 }),
  armMeasurement: decimal("armMeasurement", { precision: 5, scale: 2 }),
  thighMeasurement: decimal("thighMeasurement", { precision: 5, scale: 2 }),
  notes: text("notes"),
  recordedAt: datetime("recordedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BodyMetric = typeof bodyMetrics.$inferSelect;
export type InsertBodyMetric = typeof bodyMetrics.$inferInsert;

/**
 * Wellness Logs - Sleep, water, mood, energy tracking
 */
export const wellnessLogs = mysqlTable("wellnessLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  logDate: datetime("logDate").notNull(),
  sleepHours: decimal("sleepHours", { precision: 4, scale: 2 }),
  sleepQuality: mysqlEnum("sleepQuality", ["poor", "fair", "good", "excellent"]),
  waterIntakeLiters: decimal("waterIntakeLiters", { precision: 5, scale: 2 }),
  mood: mysqlEnum("mood", ["terrible", "bad", "okay", "good", "great"]),
  energyLevel: smallint("energyLevel"), // 1-10 scale
  stress: smallint("stress"), // 1-10 scale
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WellnessLog = typeof wellnessLogs.$inferSelect;
export type InsertWellnessLog = typeof wellnessLogs.$inferInsert;

/**
 * Achievements - Badge definitions
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "milestone", "streak", "personal_record", "consistency",
    "wellness", "goal", "special"
  ]).notNull(),
  icon: varchar("icon", { length: 255 }), // icon name or emoji
  requirement: varchar("requirement", { length: 255 }), // description of how to earn
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

/**
 * User Achievements - Badges earned by users
 */
export const userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  unlockedAt: datetime("unlockedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * Streaks - Track workout consistency
 */
export const streaks = mysqlTable("streaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  streakType: mysqlEnum("streakType", ["daily_workout", "weekly_goal", "custom"]).notNull(),
  currentCount: int("currentCount").default(0),
  maxCount: int("maxCount").default(0),
  lastActivityDate: datetime("lastActivityDate"),
  startDate: datetime("startDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Streak = typeof streaks.$inferSelect;
export type InsertStreak = typeof streaks.$inferInsert;

/**
 * Scheduled Workouts - Upcoming scheduled workouts
 */
export const scheduledWorkouts = mysqlTable("scheduledWorkouts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  routineId: int("routineId"),
  name: varchar("name", { length: 255 }).notNull(),
  scheduledDate: datetime("scheduledDate").notNull(),
  reminderEnabled: boolean("reminderEnabled").default(true),
  reminderMinutesBefore: smallint("reminderMinutesBefore").default(30),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledWorkout = typeof scheduledWorkouts.$inferSelect;
export type InsertScheduledWorkout = typeof scheduledWorkouts.$inferInsert;
