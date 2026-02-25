import { z } from "zod"

export const createEventSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export type CreateEventFormValues = z.infer<typeof createEventSchema>

export const updateEventSchema = z.object({
  date: z.string().optional(),
  description: z.string().optional(),
  location_lat: z
    .union([z.number(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  location_lng: z
    .union([z.number(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
})

export type UpdateEventFormValues = z.infer<typeof updateEventSchema>

export const sendInvitationsSchema = z.object({
  emails: z.string().trim().min(1, "Enter at least one email"),
})

export type SendInvitationsFormValues = z.infer<typeof sendInvitationsSchema>
