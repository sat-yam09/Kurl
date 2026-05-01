import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  userProfiles,
  InsertUserProfile,
  exercises,
  workoutRoutines,
  workoutSessions,
  sessionExercises,
  fitnessGoals,
  bodyMetrics,
  wellnessLogs,
  userAchievements,
  streaks,
  scheduledWorkouts,
  routineExercises,
  achievements
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// User Profile Queries
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserProfile(userId: number, profile: Partial<InsertUserProfile>) {
  const db = await getDb();
  if (!db) return;

  const existing = await getUserProfile(userId);
  
  if (existing) {
    await db.update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({
      userId,
      ...profile,
    });
  }
}

// Exercise Queries
export async function getExercises(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(exercises).limit(limit);
}

export async function getExercisesByMuscleGroup(muscleGroup: any) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(exercises).where(eq(exercises.muscleGroup, muscleGroup));
}

export async function getExerciseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Workout Routine Queries
export async function getUserWorkoutRoutines(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(workoutRoutines)
    .where(eq(workoutRoutines.userId, userId))
    .orderBy(desc(workoutRoutines.updatedAt));
}

export async function getWorkoutRoutineById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(workoutRoutines).where(eq(workoutRoutines.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRoutineExercises(routineId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(routineExercises)
    .where(eq(routineExercises.routineId, routineId))
    .orderBy(routineExercises.orderIndex);
}

// Workout Session Queries
export async function getUserWorkoutSessions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(workoutSessions)
    .where(eq(workoutSessions.userId, userId))
    .orderBy(desc(workoutSessions.startTime))
    .limit(limit);
}

export async function getWorkoutSessionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSessionExercises(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(sessionExercises.orderIndex);
}

// Fitness Goal Queries
export async function getUserFitnessGoals(userId: number, status?: any) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [eq(fitnessGoals.userId, userId)];
  if (status) {
    conditions.push(eq(fitnessGoals.status, status));
  }
  
  return await db.select().from(fitnessGoals)
    .where(and(...conditions))
    .orderBy(desc(fitnessGoals.updatedAt));
}

export async function getFitnessGoalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(fitnessGoals).where(eq(fitnessGoals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Body Metrics Queries
export async function getUserBodyMetrics(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(desc(bodyMetrics.recordedAt))
    .limit(limit);
}

export async function getLatestBodyMetric(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(desc(bodyMetrics.recordedAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// Wellness Log Queries
export async function getUserWellnessLogs(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(wellnessLogs)
    .where(eq(wellnessLogs.userId, userId))
    .orderBy(desc(wellnessLogs.logDate))
    .limit(limit);
}

export async function getWellnessLogByDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return undefined;
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const result = await db.select().from(wellnessLogs)
    .where(and(
      eq(wellnessLogs.userId, userId),
      gte(wellnessLogs.logDate, startOfDay),
      lte(wellnessLogs.logDate, endOfDay)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// Achievement Queries
export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.unlockedAt));
}

export async function getAchievementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(achievements).where(eq(achievements.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAchievements() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(achievements);
}

// Streak Queries
export async function getUserStreaks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(streaks).where(eq(streaks.userId, userId));
}

export async function getUserStreakByType(userId: number, streakType: any) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(streaks)
    .where(and(
      eq(streaks.userId, userId),
      eq(streaks.streakType, streakType)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// Scheduled Workout Queries
export async function getUserScheduledWorkouts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scheduledWorkouts)
    .where(eq(scheduledWorkouts.userId, userId))
    .orderBy(scheduledWorkouts.scheduledDate);
}

export async function getUpcomingScheduledWorkouts(userId: number, days = 7) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return await db.select().from(scheduledWorkouts)
    .where(and(
      eq(scheduledWorkouts.userId, userId),
      gte(scheduledWorkouts.scheduledDate, now),
      lte(scheduledWorkouts.scheduledDate, futureDate)
    ))
    .orderBy(scheduledWorkouts.scheduledDate);
}
