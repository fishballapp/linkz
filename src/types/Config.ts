import { z } from "zod";

// When updating config schema, please also update config-schema.json
const ConfigSchema = z.object({
  outDir: z.string(),
  publicDir: z.string().optional(),
  poweredBy: z.boolean().optional(),
  favicon: z.string().optional(),
  profilePicture: z.string(),
  name: z.string(),
  stylesheets: z.string().array().default([]),
  links: z.array(
    z.object({
      title: z.string(),
      href: z.string(),
    }),
  ),
});

export type Config = z.infer<typeof ConfigSchema>;

const DEFAULT_CONFIG: Partial<Config> = {
  poweredBy: true,
};

export const parseConfig = (
  c: unknown,
): {
  success: true;
  config: Config;
} | {
  success: false;
  reasons: string[];
} => {
  const parsed = ConfigSchema.safeParse(c);

  if (!parsed.success) {
    return {
      success: false,
      reasons: parsed.error.errors.map((e) => e.message),
    };
  }

  return {
    success: true,
    config: {
      ...DEFAULT_CONFIG,
      ...parsed.data,
    },
  };
};
