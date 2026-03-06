import "dotenv/config";

import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifyApiReference from "@scalar/fastify-api-reference";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";

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
      {
        title: "Treinos API",
        slug: "treinos-api",
        url: "/swagger.json",
      },
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
  schema: {
    hide: true,
  },
  handler: async () => {
    return app.swagger();
  },
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/",
  schema: {
    description: "Funcionando...",
    tags: ["API"],
    response: {
      200: z.object({
        message: z.string(),
      }),
    },
  },
  handler: () => {
    return {
      message: "Funcionando",
    };
  },
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/workout-plans",

  schema: {
    tags: ["Workout Plans"],

    body: z.object({
      name: z.string(),

      workoutDays: z.array(
        z.object({
          name: z.string(),
          weekDay: z.nativeEnum(Weekday),
          isRest: z.boolean(),
          estimatedDurationInSeconds: z.number(),
          coverImageUrl: z.string().optional(),

          exercises: z.array(
            z.object({
              order: z.number(),
              name: z.string(),
              sets: z.number(),
              reps: z.number(),
              restTimeInSeconds: z.number(),
            }),
          ),
        }),
      ),
    }),

    response: {
      201: z.any(),

      401: z.object({
        error: z.string(),
      }),

      500: z.object({
        error: z.string(),
      }),
    },
  },

  handler: async (request, reply) => {
    try {
      const headers = new Headers();

      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) {
          headers.append(key, String(value));
        }
      });

      const session = await auth.api.getSession({
        headers,
      });

      if (!session) {
        return reply.status(401).send({
          error: "Unauthorized",
        });
      }

      const service = new CreateWorkoutPlan();

      const result = await service.execute({
        userId: session.user.id,
        ...request.body,
      });

      return reply.status(201).send(result);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to create workout plan",
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

      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });

      const body = await response.text();

      reply.send(body);
    } catch (error) {
      request.log.error(error);

      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

try {
  await app.listen({
    port: Number(process.env.PORT) || 8081,
  });

  console.log("🚀 Server running on http://localhost:8081");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
