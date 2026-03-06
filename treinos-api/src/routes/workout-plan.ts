import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { NotFoundError } from "../error/index.js";
import { auth } from "../lib/auth.js";
import {
  CreateWorkoutPlanBodySchema,
  ErrorSchema,
  WorkoutPlanSchema,
} from "../schemas/index.js";
import { CreateWorkoutPlan } from "../usecases/CreateWorkoutPlan.js";

export const workoutPlanRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Workout Plans"],
      body: CreateWorkoutPlanBodySchema,
      response: {
        201: WorkoutPlanSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        });

        if (!session) {
          return reply
            .status(401)
            .send({ error: "Unauthorized", code: "UNAUTHORIZED" });
        }

        const body = CreateWorkoutPlanBodySchema.parse(request.body);

        const createWorkoutPlan = new CreateWorkoutPlan();

        const result = await createWorkoutPlan.execute({
          userId: session.user.id,
          name: body.name,
          workoutDays: body.workoutDays,
        });

        const responsePayload = {
          id: result.id,
          name: result.name,
          userId: result.userId,
          isActive: result.isActive,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
          workoutDays: result.workoutDays.map((day) => ({
            id: day.id,
            name: day.name,
            weekDay: day.weekDay,
            isRest: day.isRest,
            estimatedDurationInSeconds: day.estimatedDurationInSeconds,
            createdAt: day.createdAt.toISOString(),
            updatedAt: day.updatedAt.toISOString(),
            exercises: day.exercises.map((ex) => ({
              id: ex.id,
              name: ex.name,
              order: ex.order,
              sets: ex.sets,
              reps: ex.reps,
              restTimeInSeconds: ex.restTimeInSeconds,
              createdAt: ex.createdAt.toISOString(),
              updatedAt: ex.updatedAt.toISOString(),
            })),
          })),
        };

        return reply.status(201).send(responsePayload);
      } catch (error) {
        app.log.error(error);
        if (error instanceof NotFoundError) {
          return reply
            .status(404)
            .send({ error: error.message, code: "NOT_FOUND" });
        }
        return reply.status(500).send({
          error: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
};
