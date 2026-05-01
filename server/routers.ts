import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import * as db from "./db";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  userProfiles,
  workoutRoutines,
  routineExercises,
  workoutSessions,
  sessionExercises,
  fitnessGoals,
  bodyMetrics,
  wellnessLogs,
  userAchievements,
  streaks,
  scheduledWorkouts,
  achievements
} from "../drizzle/schema";

async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return drizzle(process.env.DATABASE_URL);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // User Profile Procedures
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserProfile(ctx.user.id);
    }),

    upsert: protectedProcedure
      .input(z.object({
        age: z.number().optional(),
        weight: z.number().optional(),
        height: z.number().optional(),
        fitnessLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]).optional(),
        primaryGoal: z.enum(["weight_loss", "muscle_gain", "endurance", "strength", "general_fitness"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profileData: any = {
          age: input.age,
          fitnessLevel: input.fitnessLevel,
          primaryGoal: input.primaryGoal,
        };
        if (input.weight !== undefined) profileData.weight = input.weight.toString();
        if (input.height !== undefined) profileData.height = input.height.toString();
        
        await db.upsertUserProfile(ctx.user.id, profileData);
        return await db.getUserProfile(ctx.user.id);
      }),
  }),

  // Exercise Library Procedures
  exercises: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(200) }).optional())
      .query(async ({ input }) => {
        return await db.getExercises(input?.limit);
      }),

    byMuscleGroup: publicProcedure
      .input(z.object({ muscleGroup: z.string() }))
      .query(async ({ input }) => {
        return await db.getExercisesByMuscleGroup(input.muscleGroup);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getExerciseById(input.id);
      }),
  }),

  // Workout Routine Procedures
  routines: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserWorkoutRoutines(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const routine = await db.getWorkoutRoutineById(input.id);
        if (!routine || routine.userId !== ctx.user.id) return null;
        return routine;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        focusArea: z.enum(["full_body", "upper_body", "lower_body", "push", "pull", "legs", "cardio", "flexibility", "custom"]),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        durationMinutes: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        const result = await dbInstance.insert(workoutRoutines).values({
          userId: ctx.user.id,
          ...input,
        });

        return { id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        focusArea: z.enum(["full_body", "upper_body", "lower_body", "push", "pull", "legs", "cardio", "flexibility", "custom"]).optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        durationMinutes: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const routine = await db.getWorkoutRoutineById(input.id);
        if (!routine || routine.userId !== ctx.user.id) throw new Error("Unauthorized");

        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        const { id, ...updateData } = input;
        await dbInstance.update(workoutRoutines).set({
          ...updateData,
          updatedAt: new Date(),
        }).where(eq(workoutRoutines.id, id));

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const routine = await db.getWorkoutRoutineById(input.id);
        if (!routine || routine.userId !== ctx.user.id) throw new Error("Unauthorized");

        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        await dbInstance.delete(workoutRoutines).where(eq(workoutRoutines.id, input.id));
        return { success: true };
      }),

    getExercises: protectedProcedure
      .input(z.object({ routineId: z.number() }))
      .query(async ({ ctx, input }) => {
        const routine = await db.getWorkoutRoutineById(input.routineId);
        if (!routine || routine.userId !== ctx.user.id) return [];
        return await db.getRoutineExercises(input.routineId);
      }),
  }),

  // Workout Session Procedures
  sessions: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserWorkoutSessions(ctx.user.id, input?.limit);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getWorkoutSessionById(input.id);
        if (!session || session.userId !== ctx.user.id) return null;
        return session;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        focusArea: z.enum(["full_body", "upper_body", "lower_body", "push", "pull", "legs", "cardio", "flexibility", "custom"]),
        routineId: z.number().optional(),
        startTime: z.date(),
        notes: z.string().optional(),
        mood: z.enum(["great", "good", "okay", "bad", "terrible"]).optional(),
        energy: z.number().optional(),
        difficulty: z.enum(["easy", "moderate", "hard", "very_hard"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        const result = await dbInstance.insert(workoutSessions).values({
          userId: ctx.user.id,
          ...input,
        });

        return { id: result[0].insertId };
      }),

    complete: protectedProcedure
      .input(z.object({
        id: z.number(),
        endTime: z.date(),
        durationMinutes: z.number().optional(),
        totalVolume: z.number().optional(),
        totalSets: z.number().optional(),
        totalReps: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getWorkoutSessionById(input.id);
        if (!session || session.userId !== ctx.user.id) throw new Error("Unauthorized");

        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        const { id, ...updateData } = input;
        await dbInstance.update(workoutSessions).set({
          ...updateData,
          updatedAt: new Date(),
        }).where(eq(workoutSessions.id, id));

        return { success: true };
      }),

    getExercises: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getWorkoutSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) return [];
        return await db.getSessionExercises(input.sessionId);
      }),
  }),

  // Fitness Goals Procedures
  goals: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserFitnessGoals(ctx.user.id, input?.status);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const goal = await db.getFitnessGoalById(input.id);
        if (!goal || goal.userId !== ctx.user.id) return null;
        return goal;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        goalType: z.enum(["weight_loss", "muscle_gain", "strength", "endurance", "flexibility", "consistency", "custom"]),
        targetValue: z.number().optional(),
        unit: z.string().optional(),
        startDate: z.date(),
        targetDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        const insertData: any = {
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          goalType: input.goalType,
          unit: input.unit,
          startDate: input.startDate,
          targetDate: input.targetDate,
        };
        if (input.targetValue !== undefined) insertData.targetValue = input.targetValue.toString();
        
        const result = await dbInstance.insert(fitnessGoals).values(insertData);

        return { id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        currentValue: z.number().optional(),
        progress: z.number().optional(),
        status: z.enum(["active", "completed", "abandoned"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const goal = await db.getFitnessGoalById(input.id);
        if (!goal || goal.userId !== ctx.user.id) throw new Error("Unauthorized");

        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        const { id, currentValue, progress, status } = input;
        const updateData: any = {
          updatedAt: new Date(),
        };
        if (currentValue !== undefined) updateData.currentValue = currentValue.toString();
        if (progress !== undefined) updateData.progress = progress;
        if (status !== undefined) updateData.status = status;
        
        await dbInstance.update(fitnessGoals).set(updateData).where(eq(fitnessGoals.id, id));

        return { success: true };
      }),
  }),

  // Body Metrics Procedures
  bodyMetrics: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserBodyMetrics(ctx.user.id, input?.limit);
      }),

    getLatest: protectedProcedure.query(async ({ ctx }) => {
      return await db.getLatestBodyMetric(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        weight: z.number().optional(),
        bodyFatPercentage: z.number().optional(),
        chestMeasurement: z.number().optional(),
        waistMeasurement: z.number().optional(),
        hipMeasurement: z.number().optional(),
        armMeasurement: z.number().optional(),
        thighMeasurement: z.number().optional(),
        notes: z.string().optional(),
        recordedAt: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        const insertData: any = { userId: ctx.user.id };
        const numericFields = ['weight', 'bodyFatPercentage', 'chestMeasurement', 'waistMeasurement', 'hipMeasurement', 'armMeasurement', 'thighMeasurement'];
        numericFields.forEach(field => {
          if ((input as any)[field] !== undefined) {
            insertData[field] = (input as any)[field].toString();
          }
        });
        if (input.notes) insertData.notes = input.notes;
        insertData.recordedAt = input.recordedAt;
        
        const result = await dbInstance.insert(bodyMetrics).values(insertData);

        return { id: result[0].insertId };
      }),
  }),

  // Wellness Log Procedures
  wellness: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserWellnessLogs(ctx.user.id, input?.limit);
      }),

    getByDate: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ ctx, input }) => {
        return await db.getWellnessLogByDate(ctx.user.id, input.date);
      }),

    create: protectedProcedure
      .input(z.object({
        logDate: z.date(),
        sleepHours: z.number().optional(),
        sleepQuality: z.enum(["poor", "fair", "good", "excellent"]).optional(),
        waterIntakeLiters: z.number().optional(),
        mood: z.enum(["terrible", "bad", "okay", "good", "great"]).optional(),
        energyLevel: z.number().optional(),
        stress: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        const insertData: any = {
          userId: ctx.user.id,
          logDate: input.logDate,
          sleepQuality: input.sleepQuality,
          mood: input.mood,
          energyLevel: input.energyLevel,
          stress: input.stress,
          notes: input.notes,
        };
        if (input.sleepHours !== undefined) insertData.sleepHours = input.sleepHours.toString();
        if (input.waterIntakeLiters !== undefined) insertData.waterIntakeLiters = input.waterIntakeLiters.toString();
        
        const result = await dbInstance.insert(wellnessLogs).values(insertData);

        return { id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        sleepHours: z.number().optional(),
        sleepQuality: z.enum(["poor", "fair", "good", "excellent"]).optional(),
        waterIntakeLiters: z.number().optional(),
        mood: z.enum(["terrible", "bad", "okay", "good", "great"]).optional(),
        energyLevel: z.number().optional(),
        stress: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        const { id, sleepHours, waterIntakeLiters, sleepQuality, mood, energyLevel, stress, notes } = input;
        const updateData: any = {
          updatedAt: new Date(),
        };
        if (sleepHours !== undefined) updateData.sleepHours = sleepHours.toString();
        if (waterIntakeLiters !== undefined) updateData.waterIntakeLiters = waterIntakeLiters.toString();
        if (sleepQuality !== undefined) updateData.sleepQuality = sleepQuality;
        if (mood !== undefined) updateData.mood = mood;
        if (energyLevel !== undefined) updateData.energyLevel = energyLevel;
        if (stress !== undefined) updateData.stress = stress;
        if (notes !== undefined) updateData.notes = notes;
        
        await dbInstance.update(wellnessLogs).set(updateData).where(eq(wellnessLogs.id, id));

        return { success: true };
      }),
  }),

  // Achievements Procedures
  achievements: router({
    list: publicProcedure.query(async () => {
      return await db.getAllAchievements();
    }),

    userAchievements: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAchievements(ctx.user.id);
    }),
  }),

  // Streaks Procedures
  streaks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStreaks(ctx.user.id);
    }),

    getByType: protectedProcedure
      .input(z.object({ streakType: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserStreakByType(ctx.user.id, input.streakType);
      }),
  }),

  // Scheduled Workouts Procedures
  scheduled: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserScheduledWorkouts(ctx.user.id);
    }),

    upcoming: protectedProcedure
      .input(z.object({ days: z.number().default(7) }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUpcomingScheduledWorkouts(ctx.user.id, input?.days);
      }),

    create: protectedProcedure
      .input(z.object({
        routineId: z.number().optional(),
        name: z.string(),
        scheduledDate: z.date(),
        reminderEnabled: z.boolean().default(true),
        reminderMinutesBefore: z.number().default(30),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not available");

        const result = await dbInstance.insert(scheduledWorkouts).values({
          userId: ctx.user.id,
          ...input,
        });

        return { id: result[0].insertId };
      }),
  }),
});

export type AppRouter = typeof appRouter;
