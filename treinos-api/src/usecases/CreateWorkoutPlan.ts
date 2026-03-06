import { NotFoundError } from "../error/index.js";
import { Weekday } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  name: string;

  workoutDays: Array<{
    name: string;
    weekDay: Weekday;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;

    exercises: Array<{
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

export class CreateWorkoutPlan {
  async execute(dto: InputDto) {
    return prisma.$transaction(async (tx) => {
      // verifica se o usuário existe
      const user = await tx.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // desativa plano atual
      const existingWorkoutPlan = await tx.workoutPlan.findFirst({
        where: {
          userId: dto.userId,
          isActive: true,
        },
      });

      if (existingWorkoutPlan) {
        await tx.workoutPlan.update({
          where: { id: existingWorkoutPlan.id },
          data: { isActive: false },
        });
      }

      // cria novo plano
      const workoutPlan = await tx.workoutPlan.create({
        data: {
          name: dto.name,
          userId: dto.userId,
          isActive: true,

          workoutDays: {
            create: dto.workoutDays.map((day) => ({
              name: day.name,
              weekDay: day.weekDay,
              isRest: day.isRest,
              estimatedDurationInSeconds: day.estimatedDurationInSeconds,

              exercises: {
                create: day.exercises.map((exercise) => ({
                  name: exercise.name,
                  order: exercise.order,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  restTimeInSeconds: exercise.restTimeInSeconds,
                })),
              },
            })),
          },
        },
        include: {
          workoutDays: {
            include: {
              exercises: true,
            },
          },
        },
      });

      if (!workoutPlan) {
        throw new NotFoundError("Workout plan not found");
      }

      return workoutPlan;
    });
  }
}
