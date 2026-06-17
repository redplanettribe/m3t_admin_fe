import { z } from "zod"

const announcementActionSchema = z.enum([
  "info",
  "open_event",
  "open_session",
  "open_agenda",
  "open_url",
])

export const sendAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    body: z.string().trim().min(1, "Body is required"),
    action: announcementActionSchema,
    session_id: z.string().optional(),
    url: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "open_session" && !data.session_id?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Session is required for this action",
        path: ["session_id"],
      })
    }
    if (data.action === "open_url") {
      const url = data.url?.trim() ?? ""
      if (!url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL is required for this action",
          path: ["url"],
        })
      } else if (!url.startsWith("https://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL must start with https://",
          path: ["url"],
        })
      }
    }
  })

export type SendAnnouncementFormValues = z.infer<typeof sendAnnouncementSchema>
