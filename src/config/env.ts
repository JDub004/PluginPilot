import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  HOST: z.string().default('0.0.0.0'),
  MAX_BODY_BYTES: z.coerce.number().int().min(1024).max(5_000_000).default(256_000),
  LOG_ANALYTICS: z.enum(['on', 'off']).default('on'),
  // Operator details for the legal pages. Set them in the hosting dashboard, never in code.
  OPERATOR_NAME: z.string().trim().max(120).default('[Operator name]'),
  OPERATOR_ADDRESS: z.string().trim().max(300).default('[Postal address]'),
  OPERATOR_COUNTRY: z.string().trim().max(60).default('Germany'),
  CONTACT_EMAIL: z.string().trim().max(120).default('[contact e-mail]'),
  // Token shown in the OpenAI plugin submission portal (domain verification).
  OPENAI_APPS_CHALLENGE: z.string().trim().max(512).optional(),
});

export type Env = z.infer<typeof EnvSchema>;
export const loadEnv = (src: NodeJS.ProcessEnv = process.env): Env => EnvSchema.parse(src);
