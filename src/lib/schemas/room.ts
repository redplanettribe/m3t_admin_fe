import { z } from "zod"

export const roomUpdateSchema = z.object({
  name: z.string().trim().optional(),
  capacity: z
    .union([z.number(), z.nan()])
    .optional()
    .transform((value) => (Number.isNaN(value) ? undefined : value)),
  description: z.string().trim().optional(),
  how_to_get_there: z.string().trim().optional(),
  not_bookable: z.boolean().optional(),
})

export type RoomUpdateFormValues = z.infer<typeof roomUpdateSchema>

