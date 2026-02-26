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

export type UpdateEventFormInput = z.input<typeof updateEventSchema>
export type UpdateEventFormValues = z.infer<typeof updateEventSchema>

export const sendInvitationsSchema = z.object({
  emails: z.string().trim().min(1, "Enter at least one email"),
})

export type SendInvitationsFormValues = z.infer<typeof sendInvitationsSchema>

export const createSpeakerSchema = z
  .object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    bio: z.string().optional(),
    tag_line: z.string().optional(),
    profile_picture: z.string().optional(),
    is_top_speaker: z.boolean().optional(),
  })
  .refine(
    (data) =>
      (data.first_name?.trim()?.length ?? 0) > 0 ||
      (data.last_name?.trim()?.length ?? 0) > 0,
    { message: "Enter first name or last name", path: ["first_name"] }
  )

export type CreateSpeakerFormValues = z.infer<typeof createSpeakerSchema>

export const createRoomSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  capacity: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
  how_to_get_there: z.string().optional(),
  not_bookable: z.boolean().optional(),
})

export type CreateRoomFormValues = z.infer<typeof createRoomSchema>
