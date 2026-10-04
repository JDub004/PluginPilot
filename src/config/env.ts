import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  HOST: z.string().default('0.0.0.0'),
  MAX_BODY_BYTES: z.coerce.number().int().min(1024).max(5_000_000).default(256_000),
  LOG_ANALYTICS: z.enum(['on', 'off']).default('on'),
});

export type Env = z.infer<typeof EnvSchema>;
export const loadEnv = (src: NodeJS.ProcessEnv = process.env): Env => EnvSchema.parse(src);
