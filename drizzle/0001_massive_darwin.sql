CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('milestone','streak','personal_record','consistency','wellness','goal','special') NOT NULL,
	`icon` varchar(255),
	`requirement` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bodyMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weight` decimal(5,2),
	`bodyFatPercentage` decimal(5,2),
	`chestMeasurement` decimal(5,2),
	`waistMeasurement` decimal(5,2),
	`hipMeasurement` decimal(5,2),
	`armMeasurement` decimal(5,2),
	`thighMeasurement` decimal(5,2),
	`notes` text,
	`recordedAt` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bodyMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`muscleGroup` enum('chest','back','shoulders','biceps','triceps','forearms','legs','quadriceps','hamstrings','glutes','calves','core','abs','obliques','lower_back','cardio','stretching') NOT NULL,
	`equipment` enum('barbell','dumbbell','kettlebell','cable','machine','bodyweight','resistance_band','medicine_ball','plate','treadmill','rowing_machine','bike','elliptical','foam_roller','none') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'intermediate',
	`instructions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fitnessGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`goalType` enum('weight_loss','muscle_gain','strength','endurance','flexibility','consistency','custom') NOT NULL,
	`targetValue` decimal(8,2),
	`currentValue` decimal(8,2),
	`unit` varchar(50),
	`startDate` datetime NOT NULL,
	`targetDate` datetime,
	`status` enum('active','completed','abandoned') DEFAULT 'active',
	`progress` smallint DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fitnessGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routineExercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routineId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`orderIndex` smallint NOT NULL,
	`targetSets` smallint,
	`targetReps` varchar(50),
	`restSeconds` smallint,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `routineExercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduledWorkouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`routineId` int,
	`name` varchar(255) NOT NULL,
	`scheduledDate` datetime NOT NULL,
	`reminderEnabled` boolean DEFAULT true,
	`reminderMinutesBefore` smallint DEFAULT 30,
	`completed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledWorkouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessionExercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`orderIndex` smallint NOT NULL,
	`sets` json NOT NULL,
	`totalVolume` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessionExercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`streakType` enum('daily_workout','weekly_goal','custom') NOT NULL,
	`currentCount` int DEFAULT 0,
	`maxCount` int DEFAULT 0,
	`lastActivityDate` datetime,
	`startDate` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `streaks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAchievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userAchievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`age` smallint,
	`weight` decimal(5,2),
	`height` decimal(5,2),
	`fitnessLevel` enum('beginner','intermediate','advanced','elite') DEFAULT 'beginner',
	`primaryGoal` enum('weight_loss','muscle_gain','endurance','strength','general_fitness'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `wellnessLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`logDate` datetime NOT NULL,
	`sleepHours` decimal(4,2),
	`sleepQuality` enum('poor','fair','good','excellent'),
	`waterIntakeLiters` decimal(5,2),
	`mood` enum('terrible','bad','okay','good','great'),
	`energyLevel` smallint,
	`stress` smallint,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wellnessLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workoutRoutines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`focusArea` enum('full_body','upper_body','lower_body','push','pull','legs','cardio','flexibility','custom') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'intermediate',
	`durationMinutes` smallint,
	`isTemplate` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workoutRoutines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workoutSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`routineId` int,
	`name` varchar(255) NOT NULL,
	`focusArea` enum('full_body','upper_body','lower_body','push','pull','legs','cardio','flexibility','custom') NOT NULL,
	`startTime` datetime NOT NULL,
	`endTime` datetime,
	`durationMinutes` smallint,
	`totalVolume` int,
	`totalSets` smallint,
	`totalReps` int,
	`notes` text,
	`mood` enum('great','good','okay','bad','terrible'),
	`energy` smallint,
	`difficulty` enum('easy','moderate','hard','very_hard'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workoutSessions_id` PRIMARY KEY(`id`)
);
