import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  avatarUrl: z.string().url().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const GoogleProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  verified_email: z.boolean().optional(),
  name: z.string(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional(),
});

export type GoogleProfile = z.infer<typeof GoogleProfileSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export type Session = z.infer<typeof SessionSchema>;
