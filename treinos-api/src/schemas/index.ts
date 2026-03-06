import z from "zod";

import { Weekday } from "../generated/prisma/enums.js";

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

export const WorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  workoutDays: z.array(
    z.object({
      name: z.string().trim().min(1),
      weekDay: z.enum(Weekday),
      isRest: z.boolean().default(false),
      estimatedDurationInSeconds: z.number().min(1),
      createdAt: z.string(),
      updatedAt: z.string(),
      exercises: z.array(
        z.object({
          name: z.string().trim().min(1),
          order: z.number().min(0),
          sets: z.number().min(1),
          reps: z.number().min(1),
          restTimeInSeconds: z.number().min(1),
          createdAt: z.string(),
          updatedAt: z.string(),
        }),
      ),
    }),
  ),
});

export const CreateWorkoutPlanBodySchema = z.object({
  name: z.string().trim().min(1),
  workoutDays: z.array(
    z.object({
      name: z.string().trim().min(1),
      weekDay: z.enum(Weekday),
      isRest: z.boolean().default(false),
      estimatedDurationInSeconds: z.number().min(1),
      coverImageUrl: z.string().optional(),
      exercises: z.array(
        z.object({
          order: z.number().min(0),
          name: z.string().trim().min(1),
          sets: z.number().min(1),
          reps: z.number().min(1),
          restTimeInSeconds: z.number().min(1),
        }),
      ),
    }),
  ),
});
