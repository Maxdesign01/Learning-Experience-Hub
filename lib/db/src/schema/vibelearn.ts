import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const profilesTable = pgTable(
  "vibelearn_profiles",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    displayName: text("display_name").notNull(),
    level: text("level").notNull().default("complete_beginner"),
    minutesPerDay: integer("minutes_per_day").notNull().default(30),
    preferredTime: text("preferred_time").notNull().default("evening"),
    preferredDays: text("preferred_days").array().notNull().default([]),
    onboardingComplete: boolean("onboarding_complete").notNull().default(false),
    lastActiveAt: timestamp("last_active_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIndex: uniqueIndex("vibelearn_profiles_user_id_idx").on(table.userId),
  }),
);

export const stagesTable = pgTable("vibelearn_stages", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
});

export const lessonsTable = pgTable("vibelearn_lessons", {
  id: serial("id").primaryKey(),
  stageId: integer("stage_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  duration: integer("duration").notNull(),
  description: text("description").notNull(),
  projectTask: text("project_task").notNull(),
  objective: text("objective").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  keyConcepts: text("key_concepts").array().notNull().default([]),
  explanation: text("explanation").notNull(),
  example: text("example").notNull(),
  exercise: text("exercise").notNull(),
  challenge: text("challenge").notNull(),
  completionCriteria: text("completion_criteria").array().notNull().default([]),
  resourceIds: integer("resource_ids").array().notNull().default([]),
});

export const resourcesTable = pgTable("vibelearn_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  topic: text("topic").notNull(),
  stageNumber: integer("stage_number").notNull(),
  difficulty: text("difficulty").notNull(),
  description: text("description").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
});

export const projectsTable = pgTable("vibelearn_projects", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  goal: text("goal").notNull(),
  skills: text("skills").array().notNull().default([]),
  githubUrl: text("github_url"),
});

export const projectTasksTable = pgTable("vibelearn_project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
});

export const lessonProgressTable = pgTable(
  "vibelearn_lesson_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    lessonId: integer("lesson_id").notNull(),
    status: text("status").notNull().default("not_started"),
    progress: integer("progress").notNull().default(0),
    exerciseComplete: boolean("exercise_complete").notNull().default(false),
    quizComplete: boolean("quiz_complete").notNull().default(false),
    lastActivity: timestamp("last_activity", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userLessonIndex: uniqueIndex("vibelearn_lesson_progress_user_lesson_idx").on(
      table.userId,
      table.lessonId,
    ),
  }),
);

export const activityEventsTable = pgTable("vibelearn_activity_events", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertStageSchema = createInsertSchema(stagesTable).omit({
  id: true,
});
export const insertLessonSchema = createInsertSchema(lessonsTable).omit({
  id: true,
});
export const insertResourceSchema = createInsertSchema(resourcesTable).omit({
  id: true,
});
export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
});
export const insertProjectTaskSchema = createInsertSchema(
  projectTasksTable,
).omit({ id: true });

export type Profile = z.infer<typeof insertProfileSchema>;
export type Stage = typeof stagesTable.$inferSelect;
export type Lesson = typeof lessonsTable.$inferSelect;
export type Resource = typeof resourcesTable.$inferSelect;
export type Project = typeof projectsTable.$inferSelect;
export type ProjectTask = typeof projectTasksTable.$inferSelect;