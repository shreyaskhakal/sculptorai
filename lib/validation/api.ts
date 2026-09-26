import { z } from "zod";

export const GenerateRequestSchema = z.object({
  projectId: z.string().uuid().or(z.string().min(1)),
  prompt: z.string().min(2, "Prompt must be at least 2 characters").max(4000),
  blenderVersion: z.string().default("4.x"),
  includeCode: z.boolean().default(true),
  style: z.enum(["realistic", "low-poly", "stylized", "sci-fi", "minimalist"]).default("low-poly"),
  complexity: z.enum(["simple", "medium", "complex"]).default("medium"),
  previousCode: z.string().optional(),
  mode: z.enum(["create", "modify"]).default("create"),
});

export const DebugRequestSchema = z.object({
  projectId: z.string().uuid().or(z.string().min(1)),
  generationId: z.string().uuid().optional(),
  blenderVersion: z.string().default("4.x"),
  error: z.string().min(3, "Error text must be provided"),
  script: z.string().min(5, "Original script must be provided"),
});

export const ExecutionCreateSchema = z.object({
  generationId: z.string().uuid().or(z.string().min(1)),
  blenderVersion: z.string().default("4.x"),
  script: z.string().optional(),
  prompt: z.string().optional(),
});

export const ExecutionResultSchema = z.object({
  status: z.enum(["success", "error"]),
  stdout: z.string().default(""),
  stderr: z.string().default(""),
  durationMs: z.number().nonnegative().optional(),
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional().default(""),
  blenderVersion: z.string().default("4.x"),
});

export const ProjectUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  blenderVersion: z.string().optional(),
});
