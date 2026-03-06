import "dotenv/config";

import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifyApiReference from "@scalar/fastify-api-reference";
import { fromNodeHeaders } from "better-auth/node";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";

import { NotFoundError } from "./error/index.js";
import { Weekday } from "./generated/prisma/enums.js";
import { auth } from "./lib/auth.js";
import { CreateWorkoutPlan } from "./usecases/CreateWorkoutPlan.js";

const app = Fastify({
  logger: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Treinos API",
      description: "API para treinos de academia",
      version: "1.0.0",
    },
    servers: [
      {
        description: "Localhost",
        url: "http://localhost:8081",
      },
    ],
  },
  transform: jsonSchemaTransform,
});

await app.register(fastifyCors, {
  origin: ["http://localhost:3000"],
  credentials: true,
});

await app.register(fastifyApiReference, {
  routePrefix: "/docs",
  configuration: {
    sources: [
      { title: "Treinos API", slug: "treinos-api", url: "/swagger.json" },
      {
        title: "Auth API",
        slug: "auth-api",
        url: "/api/auth/open-api/generate-schema",
      },
    ],
  },
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/swagger.json",
  schema: { hide: true },
  handler: async () => app.swagger(),
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/",
  schema: {
    description: "Funcionando...",
    tags: ["API"],
    response: { 200: z.object({ message: z.string() }) },
  },
  handler: () => ({ message: "Funcionando" }),
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/workout-plans",

  schema: {
    tags: ["Workout Plans"],

    body: z.object({
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
    }),

    response: {
      201: z.object({
        id: z.string().uuid(),
        name: z.string(),
        userId: z.string(),
        isActive: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
        workoutDays: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string(),
            weekDay: z.enum(Weekday),
            isRest: z.boolean(),
            estimatedDurationInSeconds: z.number(),
            createdAt: z.string(),
            updatedAt: z.string(),
            exercises: z.array(
              z.object({
                id: z.string().uuid(),
                name: z.string(),
                order: z.number(),
                sets: z.number(),
                reps: z.number(),
                restTimeInSeconds: z.number(),
                createdAt: z.string(),
                updatedAt: z.string(),
              }),
            ),
          }),
        ),
      }),

      401: z.object({ error: z.string(), code: z.string() }),
      404: z.object({ error: z.string(), code: z.string() }),
      500: z.object({ error: z.string(), code: z.string() }),
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

      const createWorkoutPlan = new CreateWorkoutPlan();

      const result = await createWorkoutPlan.execute({
        userId: session.user.id,
        name: request.body.name,
        workoutDays: request.body.workoutDays,
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
        code: "INTERNAL SERVER ERROR",
      });
    }
  },
});

app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  handler: async (request, reply) => {
    try {
      const url = `http://${request.headers.host}${request.url}`;
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, String(value));
      });

      const req = new Request(url, {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.send(await response.text());
    } catch (error) {
      request.log.error(error);
      reply
        .status(500)
        .send({ error: "EROR INTERNAL SERVER", code: "AUTH_FAILURE" });
    }
  },
});

try {
  await app.listen({ port: Number(process.env.PORT) || 8081 });
  console.log("🚀 Server running on http://localhost:8081");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
