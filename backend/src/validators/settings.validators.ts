import { z } from "zod";

const homeContentSchema = z
  .object({
    hero: z.object({
      title: z.string().min(1).max(200),
      subtitle: z.string().max(500),
      primaryCta: z.string().min(1).max(50),
      secondaryCta: z.string().min(1).max(50),
    }),
    features: z
      .array(
        z.object({
          icon: z.string().max(10),
          title: z.string().min(1).max(80),
          description: z.string().max(200),
        }),
      )
      .min(1)
      .max(6),
    services: z.object({
      title: z.string().min(1).max(80),
      subtitle: z.string().max(200),
    }),
    howItWorks: z.object({
      title: z.string().min(1).max(80),
      subtitle: z.string().max(200),
      steps: z
        .array(
          z.object({
            title: z.string().min(1).max(80),
            description: z.string().max(200),
          }),
        )
        .min(1)
        .max(6),
    }),
    team: z.object({
      title: z.string().min(1).max(80),
      subtitle: z.string().max(200),
    }),
    contact: z.object({
      title: z.string().min(1).max(80),
      subtitle: z.string().max(300),
      hoursTitle: z.string().min(1).max(80),
      ctaButton: z.string().min(1).max(50),
    }),
    finalCta: z.object({
      title: z.string().min(1).max(120),
      subtitle: z.string().max(200),
      button: z.string().min(1).max(50),
    }),
  })
  .optional();

const timeHHMM = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (usa HH:MM)");

export const businessSettingsSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(7).max(30),
  whatsapp: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[0-9]+$/, "Solo números, sin + ni espacios (formato E.164)"),
  email: z.string().email("Email inválido"),
  address: z.string().min(3).max(200),
  openTimeWeekday: timeHHMM.optional().default("09:00"),
  closeTimeWeekday: timeHHMM.optional().default("18:00"),
  closedWeekday: z.boolean().optional().default(false),
  openTimeSaturday: timeHHMM.optional().default("09:00"),
  closeTimeSaturday: timeHHMM.optional().default("17:00"),
  closedSaturday: z.boolean().optional().default(false),
  openTimeSunday: timeHHMM.optional().default("09:00"),
  closeTimeSunday: timeHHMM.optional().default("14:00"),
  closedSunday: z.boolean().optional().default(true),
  heroImageSlug: z.string().max(200).nullable().optional(),
  logoSlug: z.string().max(200).nullable().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (usa formato hex como #570df8)")
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (usa formato hex como #570df8)")
    .nullable()
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (usa formato hex como #570df8)")
    .nullable()
    .optional(),
  fontHeading: z.string().max(60).nullable().optional(),
  fontBody: z.string().max(60).nullable().optional(),
  instagramUrl: z.string().max(200).nullable().optional(),
  facebookUrl: z.string().max(200).nullable().optional(),
  tiktokUrl: z.string().max(200).nullable().optional(),
  youtubeUrl: z.string().max(200).nullable().optional(),
  homeContent: homeContentSchema,
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
