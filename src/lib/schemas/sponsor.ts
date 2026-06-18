import { z } from "zod"

const sponsorStatusSchema = z.enum(["draft", "published", "hidden"])

export const SPONSOR_STATUSES = ["draft", "published", "hidden"] as const

export type SponsorStatus = (typeof SPONSOR_STATUSES)[number]

export const SPONSOR_STATUS_LABELS: Record<SponsorStatus, string> = {
  draft: "Draft",
  published: "Published",
  hidden: "Hidden",
}

export const OFFERING_KINDS = ["link", "coupon", "resource", "demo", "swag"] as const

export type OfferingKind = (typeof OFFERING_KINDS)[number]

export const OFFERING_KIND_LABELS: Record<OfferingKind, string> = {
  link: "Link",
  coupon: "Coupon",
  resource: "Resource",
  demo: "Demo",
  swag: "Swag",
}

const offeringKindSchema = z.enum(OFFERING_KINDS)

export const SPONSOR_BOOTH_TYPES = ["virtual", "virtual_and_physical"] as const

export type SponsorBoothType = (typeof SPONSOR_BOOTH_TYPES)[number]

export const SPONSOR_BOOTH_TYPE_LABELS: Record<SponsorBoothType, string> = {
  virtual: "Virtual",
  virtual_and_physical: "Virtual and physical",
}

const sponsorBoothTypeSchema = z.enum(SPONSOR_BOOTH_TYPES)

export const createSponsorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sponsorship_level: z.string().optional(),
  status: sponsorStatusSchema,
  booth_type: sponsorBoothTypeSchema,
})

export type CreateSponsorFormValues = z.infer<typeof createSponsorSchema>

export const updateSponsorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagline: z.string().optional(),
  description: z.string().optional(),
  sponsorship_level: z.string().optional(),
  status: sponsorStatusSchema,
  featured: z.boolean(),
  sort_order: z.number().int().optional(),
  booth_label: z.string().optional(),
  booth_type: sponsorBoothTypeSchema,
  hall: z.string().optional(),
  how_to_get_there: z.string().optional(),
  virtual_booth_url: z.string().optional(),
  website_url: z.string().optional(),
})

export type UpdateSponsorFormValues = z.infer<typeof updateSponsorSchema>

export const createOfferingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  kind: offeringKindSchema,
  cta_label: z.string().optional(),
  cta_url: z.string().optional(),
  coupon_code: z.string().optional(),
  status: sponsorStatusSchema.optional(),
})

export type CreateOfferingFormValues = z.infer<typeof createOfferingSchema>

export const updateOfferingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  kind: offeringKindSchema,
  cta_label: z.string().optional(),
  cta_url: z.string().optional(),
  coupon_code: z.string().optional(),
  status: sponsorStatusSchema.optional(),
})

export type UpdateOfferingFormValues = z.infer<typeof updateOfferingSchema>
