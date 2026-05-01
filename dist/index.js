// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
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
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  age: smallint("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  // in kg
  height: decimal("height", { precision: 5, scale: 2 }),
  // in cm
  fitnessLevel: mysqlEnum("fitnessLevel", ["beginner", "intermediate", "advanced", "elite"]).default("beginner"),
  primaryGoal: mysqlEnum("primaryGoal", ["weight_loss", "muscle_gain", "endurance", "strength", "general_fitness"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  muscleGroup: mysqlEnum("muscleGroup", [
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "forearms",
    "legs",
    "quadriceps",
    "hamstrings",
    "glutes",
    "calves",
    "core",
    "abs",
    "obliques",
    "lower_back",
    "cardio",
    "stretching"
  ]).notNull(),
  equipment: mysqlEnum("equipment", [
    "barbell",
    "dumbbell",
    "kettlebell",
    "cable",
    "machine",
    "bodyweight",
    "resistance_band",
    "medicine_ball",
    "plate",
    "treadmill",
    "rowing_machine",
    "bike",
    "elliptical",
    "foam_roller",
    "none"
  ]).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate"),
  instructions: text("instructions"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var workoutRoutines = mysqlTable("workoutRoutines", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  focusArea: mysqlEnum("focusArea", [
    "full_body",
    "upper_body",
    "lower_body",
    "push",
    "pull",
    "legs",
    "cardio",
    "flexibility",
    "custom"
  ]).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate"),
  durationMinutes: smallint("durationMinutes"),
  isTemplate: boolean("isTemplate").default(false),
  // true if it's a reusable template
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var routineExercises = mysqlTable("routineExercises", {
  id: int("id").autoincrement().primaryKey(),
  routineId: int("routineId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  orderIndex: smallint("orderIndex").notNull(),
  // order in routine
  targetSets: smallint("targetSets"),
  targetReps: varchar("targetReps", { length: 50 }),
  // e.g., "8-12", "5", "10-15"
  restSeconds: smallint("restSeconds"),
  // rest time between sets
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var workoutSessions = mysqlTable("workoutSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  routineId: int("routineId"),
  // reference to routine if based on one
  name: varchar("name", { length: 255 }).notNull(),
  focusArea: mysqlEnum("focusArea", [
    "full_body",
    "upper_body",
    "lower_body",
    "push",
    "pull",
    "legs",
    "cardio",
    "flexibility",
    "custom"
  ]).notNull(),
  startTime: datetime("startTime").notNull(),
  endTime: datetime("endTime"),
  durationMinutes: smallint("durationMinutes"),
  totalVolume: int("totalVolume"),
  // total weight x reps
  totalSets: smallint("totalSets"),
  totalReps: int("totalReps"),
  notes: text("notes"),
  mood: mysqlEnum("mood", ["great", "good", "okay", "bad", "terrible"]),
  energy: smallint("energy"),
  // 1-10 scale
  difficulty: mysqlEnum("difficulty", ["easy", "moderate", "hard", "very_hard"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var sessionExercises = mysqlTable("sessionExercises", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  orderIndex: smallint("orderIndex").notNull(),
  sets: json("sets").notNull(),
  // Array of {reps, weight, duration, notes}
  totalVolume: int("totalVolume"),
  // weight x reps sum
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var fitnessGoals = mysqlTable("fitnessGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  goalType: mysqlEnum("goalType", [
    "weight_loss",
    "muscle_gain",
    "strength",
    "endurance",
    "flexibility",
    "consistency",
    "custom"
  ]).notNull(),
  targetValue: decimal("targetValue", { precision: 8, scale: 2 }),
  currentValue: decimal("currentValue", { precision: 8, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  // kg, lbs, sets, reps, etc.
  startDate: datetime("startDate").notNull(),
  targetDate: datetime("targetDate"),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active"),
  progress: smallint("progress").default(0),
  // 0-100 percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var bodyMetrics = mysqlTable("bodyMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  // kg
  bodyFatPercentage: decimal("bodyFatPercentage", { precision: 5, scale: 2 }),
  chestMeasurement: decimal("chestMeasurement", { precision: 5, scale: 2 }),
  // cm
  waistMeasurement: decimal("waistMeasurement", { precision: 5, scale: 2 }),
  hipMeasurement: decimal("hipMeasurement", { precision: 5, scale: 2 }),
  armMeasurement: decimal("armMeasurement", { precision: 5, scale: 2 }),
  thighMeasurement: decimal("thighMeasurement", { precision: 5, scale: 2 }),
  notes: text("notes"),
  recordedAt: datetime("recordedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var wellnessLogs = mysqlTable("wellnessLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  logDate: datetime("logDate").notNull(),
  sleepHours: decimal("sleepHours", { precision: 4, scale: 2 }),
  sleepQuality: mysqlEnum("sleepQuality", ["poor", "fair", "good", "excellent"]),
  waterIntakeLiters: decimal("waterIntakeLiters", { precision: 5, scale: 2 }),
  mood: mysqlEnum("mood", ["terrible", "bad", "okay", "good", "great"]),
  energyLevel: smallint("energyLevel"),
  // 1-10 scale
  stress: smallint("stress"),
  // 1-10 scale
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "milestone",
    "streak",
    "personal_record",
    "consistency",
    "wellness",
    "goal",
    "special"
  ]).notNull(),
  icon: varchar("icon", { length: 255 }),
  // icon name or emoji
  requirement: varchar("requirement", { length: 255 }),
  // description of how to earn
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  unlockedAt: datetime("unlockedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var streaks = mysqlTable("streaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  streakType: mysqlEnum("streakType", ["daily_workout", "weekly_goal", "custom"]).notNull(),
  currentCount: int("currentCount").default(0),
  maxCount: int("maxCount").default(0),
  lastActivityDate: datetime("lastActivityDate"),
  startDate: datetime("startDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var scheduledWorkouts = mysqlTable("scheduledWorkouts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  routineId: int("routineId"),
  name: varchar("name", { length: 255 }).notNull(),
  scheduledDate: datetime("scheduledDate").notNull(),
  reminderEnabled: boolean("reminderEnabled").default(true),
  reminderMinutesBefore: smallint("reminderMinutesBefore").default(30),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserProfile(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertUserProfile(userId, profile) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserProfile(userId);
  if (existing) {
    await db.update(userProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({
      userId,
      ...profile
    });
  }
}
async function getExercises(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(exercises).limit(limit);
}
async function getExercisesByMuscleGroup(muscleGroup) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(exercises).where(eq(exercises.muscleGroup, muscleGroup));
}
async function getExerciseById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserWorkoutRoutines(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workoutRoutines).where(eq(workoutRoutines.userId, userId)).orderBy(desc(workoutRoutines.updatedAt));
}
async function getWorkoutRoutineById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(workoutRoutines).where(eq(workoutRoutines.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getRoutineExercises(routineId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(routineExercises).where(eq(routineExercises.routineId, routineId)).orderBy(routineExercises.orderIndex);
}
async function getUserWorkoutSessions(userId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId)).orderBy(desc(workoutSessions.startTime)).limit(limit);
}
async function getWorkoutSessionById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getSessionExercises(sessionId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sessionExercises).where(eq(sessionExercises.sessionId, sessionId)).orderBy(sessionExercises.orderIndex);
}
async function getUserFitnessGoals(userId, status) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(fitnessGoals.userId, userId)];
  if (status) {
    conditions.push(eq(fitnessGoals.status, status));
  }
  return await db.select().from(fitnessGoals).where(and(...conditions)).orderBy(desc(fitnessGoals.updatedAt));
}
async function getFitnessGoalById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(fitnessGoals).where(eq(fitnessGoals.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserBodyMetrics(userId, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bodyMetrics).where(eq(bodyMetrics.userId, userId)).orderBy(desc(bodyMetrics.recordedAt)).limit(limit);
}
async function getLatestBodyMetric(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(bodyMetrics).where(eq(bodyMetrics.userId, userId)).orderBy(desc(bodyMetrics.recordedAt)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserWellnessLogs(userId, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(wellnessLogs).where(eq(wellnessLogs.userId, userId)).orderBy(desc(wellnessLogs.logDate)).limit(limit);
}
async function getWellnessLogByDate(userId, date) {
  const db = await getDb();
  if (!db) return void 0;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  const result = await db.select().from(wellnessLogs).where(and(
    eq(wellnessLogs.userId, userId),
    gte(wellnessLogs.logDate, startOfDay),
    lte(wellnessLogs.logDate, endOfDay)
  )).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserAchievements(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId)).orderBy(desc(userAchievements.unlockedAt));
}
async function getAllAchievements() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(achievements);
}
async function getUserStreaks(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(streaks).where(eq(streaks.userId, userId));
}
async function getUserStreakByType(userId, streakType) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(streaks).where(and(
    eq(streaks.userId, userId),
    eq(streaks.streakType, streakType)
  )).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserScheduledWorkouts(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(scheduledWorkouts).where(eq(scheduledWorkouts.userId, userId)).orderBy(scheduledWorkouts.scheduledDate);
}
async function getUpcomingScheduledWorkouts(userId, days = 7) {
  const db = await getDb();
  if (!db) return [];
  const now = /* @__PURE__ */ new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1e3);
  return await db.select().from(scheduledWorkouts).where(and(
    eq(scheduledWorkouts.userId, userId),
    gte(scheduledWorkouts.scheduledDate, now),
    lte(scheduledWorkouts.scheduledDate, futureDate)
  )).orderBy(scheduledWorkouts.scheduledDate);
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";
import { eq as eq2 } from "drizzle-orm";
import { drizzle as drizzle2 } from "drizzle-orm/mysql2";
async function getDb2() {
  if (!process.env.DATABASE_URL) return null;
  return drizzle2(process.env.DATABASE_URL);
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // User Profile Procedures
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getUserProfile(ctx.user.id);
    }),
    upsert: protectedProcedure.input(z2.object({
      age: z2.number().optional(),
      weight: z2.number().optional(),
      height: z2.number().optional(),
      fitnessLevel: z2.enum(["beginner", "intermediate", "advanced", "elite"]).optional(),
      primaryGoal: z2.enum(["weight_loss", "muscle_gain", "endurance", "strength", "general_fitness"]).optional()
    })).mutation(async ({ ctx, input }) => {
      const profileData = {
        age: input.age,
        fitnessLevel: input.fitnessLevel,
        primaryGoal: input.primaryGoal
      };
      if (input.weight !== void 0) profileData.weight = input.weight.toString();
      if (input.height !== void 0) profileData.height = input.height.toString();
      await upsertUserProfile(ctx.user.id, profileData);
      return await getUserProfile(ctx.user.id);
    })
  }),
  // Exercise Library Procedures
  exercises: router({
    list: publicProcedure.input(z2.object({ limit: z2.number().default(200) }).optional()).query(async ({ input }) => {
      return await getExercises(input?.limit);
    }),
    byMuscleGroup: publicProcedure.input(z2.object({ muscleGroup: z2.string() })).query(async ({ input }) => {
      return await getExercisesByMuscleGroup(input.muscleGroup);
    }),
    getById: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return await getExerciseById(input.id);
    })
  }),
  // Workout Routine Procedures
  routines: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserWorkoutRoutines(ctx.user.id);
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
      const routine = await getWorkoutRoutineById(input.id);
      if (!routine || routine.userId !== ctx.user.id) return null;
      return routine;
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string(),
      description: z2.string().optional(),
      focusArea: z2.enum(["full_body", "upper_body", "lower_body", "push", "pull", "legs", "cardio", "flexibility", "custom"]),
      difficulty: z2.enum(["beginner", "intermediate", "advanced"]).optional(),
      durationMinutes: z2.number().optional()
    })).mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      const result = await dbInstance.insert(workoutRoutines).values({
        userId: ctx.user.id,
        ...input
      });
      return { id: result[0].insertId };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      description: z2.string().optional(),
      focusArea: z2.enum(["full_body", "upper_body", "lower_body", "push", "pull", "legs", "cardio", "flexibility", "custom"]).optional(),
      difficulty: z2.enum(["beginner", "intermediate", "advanced"]).optional(),
      durationMinutes: z2.number().optional()
    })).mutation(async ({ ctx, input }) => {
      const routine = await getWorkoutRoutineById(input.id);
      if (!routine || routine.userId !== ctx.user.id) throw new Error("Unauthorized");
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      const { id, ...updateData } = input;
      await dbInstance.update(workoutRoutines).set({
        ...updateData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(workoutRoutines.id, id));
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      const routine = await getWorkoutRoutineById(input.id);
      if (!routine || routine.userId !== ctx.user.id) throw new Error("Unauthorized");
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      await dbInstance.delete(workoutRoutines).where(eq2(workoutRoutines.id, input.id));
      return { success: true };
    }),
    getExercises: protectedProcedure.input(z2.object({ routineId: z2.number() })).query(async ({ ctx, input }) => {
      const routine = await getWorkoutRoutineById(input.routineId);
      if (!routine || routine.userId !== ctx.user.id) return [];
      return await getRoutineExercises(input.routineId);
    })
  }),
  // Workout Session Procedures
  sessions: router({
    list: protectedProcedure.input(z2.object({ limit: z2.number().default(50) }).optional()).query(async ({ ctx, input }) => {
      return await getUserWorkoutSessions(ctx.user.id, input?.limit);
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
      const session = await getWorkoutSessionById(input.id);
      if (!session || session.userId !== ctx.user.id) return null;
      return session;
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string(),
      focusArea: z2.enum(["full_body", "upper_body", "lower_body", "push", "pull", "legs", "cardio", "flexibility", "custom"]),
      routineId: z2.number().optional(),
      startTime: z2.date(),
      notes: z2.string().optional(),
      mood: z2.enum(["great", "good", "okay", "bad", "terrible"]).optional(),
      energy: z2.number().optional(),
      difficulty: z2.enum(["easy", "moderate", "hard", "very_hard"]).optional()
    })).mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      const result = await dbInstance.insert(workoutSessions).values({
        userId: ctx.user.id,
        ...input
      });
      return { id: result[0].insertId };
    }),
    complete: protectedProcedure.input(z2.object({
      id: z2.number(),
      endTime: z2.date(),
      durationMinutes: z2.number().optional(),
      totalVolume: z2.number().optional(),
      totalSets: z2.number().optional(),
      totalReps: z2.number().optional()
    })).mutation(async ({ ctx, input }) => {
      const session = await getWorkoutSessionById(input.id);
      if (!session || session.userId !== ctx.user.id) throw new Error("Unauthorized");
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      const { id, ...updateData } = input;
      await dbInstance.update(workoutSessions).set({
        ...updateData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(workoutSessions.id, id));
      return { success: true };
    }),
    getExercises: protectedProcedure.input(z2.object({ sessionId: z2.number() })).query(async ({ ctx, input }) => {
      const session = await getWorkoutSessionById(input.sessionId);
      if (!session || session.userId !== ctx.user.id) return [];
      return await getSessionExercises(input.sessionId);
    })
  }),
  // Fitness Goals Procedures
  goals: router({
    list: protectedProcedure.input(z2.object({ status: z2.string().optional() }).optional()).query(async ({ ctx, input }) => {
      return await getUserFitnessGoals(ctx.user.id, input?.status);
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
      const goal = await getFitnessGoalById(input.id);
      if (!goal || goal.userId !== ctx.user.id) return null;
      return goal;
    }),
    create: protectedProcedure.input(z2.object({
      title: z2.string(),
      description: z2.string().optional(),
      goalType: z2.enum(["weight_loss", "muscle_gain", "strength", "endurance", "flexibility", "consistency", "custom"]),
      targetValue: z2.number().optional(),
      unit: z2.string().optional(),
      startDate: z2.date(),
      targetDate: z2.date().optional()
    })).mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      const insertData = {
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        goalType: input.goalType,
        unit: input.unit,
        startDate: input.startDate,
        targetDate: input.targetDate
      };
      if (input.targetValue !== void 0) insertData.targetValue = input.targetValue.toString();
      const result = await dbInstance.insert(fitnessGoals).values(insertData);
      return { id: result[0].insertId };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      currentValue: z2.number().optional(),
      progress: z2.number().optional(),
      status: z2.enum(["active", "completed", "abandoned"]).optional()
    })).mutation(async ({ ctx, input }) => {
      const goal = await getFitnessGoalById(input.id);
      if (!goal || goal.userId !== ctx.user.id) throw new Error("Unauthorized");
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      const { id, currentValue, progress, status } = input;
      const updateData = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (currentValue !== void 0) updateData.currentValue = currentValue.toString();
      if (progress !== void 0) updateData.progress = progress;
      if (status !== void 0) updateData.status = status;
      await dbInstance.update(fitnessGoals).set(updateData).where(eq2(fitnessGoals.id, id));
      return { success: true };
    })
  }),
  // Body Metrics Procedures
  bodyMetrics: router({
    list: protectedProcedure.input(z2.object({ limit: z2.number().default(100) }).optional()).query(async ({ ctx, input }) => {
      return await getUserBodyMetrics(ctx.user.id, input?.limit);
    }),
    getLatest: protectedProcedure.query(async ({ ctx }) => {
      return await getLatestBodyMetric(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      weight: z2.number().optional(),
      bodyFatPercentage: z2.number().optional(),
      chestMeasurement: z2.number().optional(),
      waistMeasurement: z2.number().optional(),
      hipMeasurement: z2.number().optional(),
      armMeasurement: z2.number().optional(),
      thighMeasurement: z2.number().optional(),
      notes: z2.string().optional(),
      recordedAt: z2.date()
    })).mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      const insertData = { userId: ctx.user.id };
      const numericFields = ["weight", "bodyFatPercentage", "chestMeasurement", "waistMeasurement", "hipMeasurement", "armMeasurement", "thighMeasurement"];
      numericFields.forEach((field) => {
        if (input[field] !== void 0) {
          insertData[field] = input[field].toString();
        }
      });
      if (input.notes) insertData.notes = input.notes;
      insertData.recordedAt = input.recordedAt;
      const result = await dbInstance.insert(bodyMetrics).values(insertData);
      return { id: result[0].insertId };
    })
  }),
  // Wellness Log Procedures
  wellness: router({
    list: protectedProcedure.input(z2.object({ limit: z2.number().default(100) }).optional()).query(async ({ ctx, input }) => {
      return await getUserWellnessLogs(ctx.user.id, input?.limit);
    }),
    getByDate: protectedProcedure.input(z2.object({ date: z2.date() })).query(async ({ ctx, input }) => {
      return await getWellnessLogByDate(ctx.user.id, input.date);
    }),
    create: protectedProcedure.input(z2.object({
      logDate: z2.date(),
      sleepHours: z2.number().optional(),
      sleepQuality: z2.enum(["poor", "fair", "good", "excellent"]).optional(),
      waterIntakeLiters: z2.number().optional(),
      mood: z2.enum(["terrible", "bad", "okay", "good", "great"]).optional(),
      energyLevel: z2.number().optional(),
      stress: z2.number().optional(),
      notes: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      const insertData = {
        userId: ctx.user.id,
        logDate: input.logDate,
        sleepQuality: input.sleepQuality,
        mood: input.mood,
        energyLevel: input.energyLevel,
        stress: input.stress,
        notes: input.notes
      };
      if (input.sleepHours !== void 0) insertData.sleepHours = input.sleepHours.toString();
      if (input.waterIntakeLiters !== void 0) insertData.waterIntakeLiters = input.waterIntakeLiters.toString();
      const result = await dbInstance.insert(wellnessLogs).values(insertData);
      return { id: result[0].insertId };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      sleepHours: z2.number().optional(),
      sleepQuality: z2.enum(["poor", "fair", "good", "excellent"]).optional(),
      waterIntakeLiters: z2.number().optional(),
      mood: z2.enum(["terrible", "bad", "okay", "good", "great"]).optional(),
      energyLevel: z2.number().optional(),
      stress: z2.number().optional(),
      notes: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      const { id, sleepHours, waterIntakeLiters, sleepQuality, mood, energyLevel, stress, notes } = input;
      const updateData = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (sleepHours !== void 0) updateData.sleepHours = sleepHours.toString();
      if (waterIntakeLiters !== void 0) updateData.waterIntakeLiters = waterIntakeLiters.toString();
      if (sleepQuality !== void 0) updateData.sleepQuality = sleepQuality;
      if (mood !== void 0) updateData.mood = mood;
      if (energyLevel !== void 0) updateData.energyLevel = energyLevel;
      if (stress !== void 0) updateData.stress = stress;
      if (notes !== void 0) updateData.notes = notes;
      await dbInstance.update(wellnessLogs).set(updateData).where(eq2(wellnessLogs.id, id));
      return { success: true };
    })
  }),
  // Achievements Procedures
  achievements: router({
    list: publicProcedure.query(async () => {
      return await getAllAchievements();
    }),
    userAchievements: protectedProcedure.query(async ({ ctx }) => {
      return await getUserAchievements(ctx.user.id);
    })
  }),
  // Streaks Procedures
  streaks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserStreaks(ctx.user.id);
    }),
    getByType: protectedProcedure.input(z2.object({ streakType: z2.string() })).query(async ({ ctx, input }) => {
      return await getUserStreakByType(ctx.user.id, input.streakType);
    })
  }),
  // Scheduled Workouts Procedures
  scheduled: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserScheduledWorkouts(ctx.user.id);
    }),
    upcoming: protectedProcedure.input(z2.object({ days: z2.number().default(7) }).optional()).query(async ({ ctx, input }) => {
      return await getUpcomingScheduledWorkouts(ctx.user.id, input?.days);
    }),
    create: protectedProcedure.input(z2.object({
      routineId: z2.number().optional(),
      name: z2.string(),
      scheduledDate: z2.date(),
      reminderEnabled: z2.boolean().default(true),
      reminderMinutesBefore: z2.number().default(30)
    })).mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb2();
      if (!dbInstance) throw new Error("Database not available");
      const result = await dbInstance.insert(scheduledWorkouts).values({
        userId: ctx.user.id,
        ...input
      });
      return { id: result[0].insertId };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
