import { z } from "zod"

/** Fixed UTC offset like "+02:00" or "-05:00" (no IANA tz database names). */
const utcOffsetTimeZoneSchema = z
  .string()
  .trim()
  .regex(/^[+-](?:[01]\d|2[0-3]):[0-5]\d$/, 'Time zone must look like "+02:00" or "-05:00"')

export const createEventSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_date: z.string().min(1, "Start date is required"),
  time_zone: utcOffsetTimeZoneSchema,
  duration_days: z
    .union([z.number().int().positive(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .default(1),
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

export type CreateEventFormInput = z.input<typeof createEventSchema>
export type CreateEventFormValues = z.infer<typeof createEventSchema>

export const updateEventSchema = z.object({
  start_date: z.string().optional(),
  time_zone: utcOffsetTimeZoneSchema,
  duration_days: z
    .union([z.number().int().positive(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
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
    phone_number: z.string().optional(),
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
  capacity: z.number().int().positive().optional(),
  how_to_get_there: z.string().optional(),
  not_bookable: z.boolean().optional(),
})

export type CreateRoomFormValues = z.infer<typeof createRoomSchema>

export const createTierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
})

export type CreateTierFormValues = z.infer<typeof createTierSchema>

export const updateTierSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
})

export type UpdateTierFormValues = z.infer<typeof updateTierSchema>

/** For edit tier modal: name required so we never submit empty. */
export const editTierFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
})

export type EditTierFormValues = z.infer<typeof editTierFormSchema>

export const assignTierEmailsSchema = z.object({
  emails: z.string().trim().min(1, "Enter at least one email"),
})

export type AssignTierEmailsFormValues = z.infer<typeof assignTierEmailsSchema>

export const createDeliverableSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  repeatable: z.boolean(),
})

export type CreateDeliverableFormValues = z.infer<typeof createDeliverableSchema>

export const editDeliverableSchema = createDeliverableSchema

export type EditDeliverableFormValues = z.infer<typeof editDeliverableSchema>
