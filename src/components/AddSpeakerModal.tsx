import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useCreateSpeaker } from "@/hooks/useSpeakers"
import {
  createSpeakerSchema,
  type CreateSpeakerFormValues,
} from "@/lib/schemas/event"
import { cn } from "@/lib/utils"
import type { CreateSpeakerRequest } from "@/types/event"

type AddSpeakerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
}

const defaultValues: CreateSpeakerFormValues = {
  first_name: "",
  last_name: "",
  full_name: "",
  bio: "",
  tag_line: "",
  profile_picture: "",
  is_top_speaker: false,
}

function toCreateSpeakerRequest(
  values: CreateSpeakerFormValues
): CreateSpeakerRequest {
  const req: CreateSpeakerRequest = {}
  if (values.first_name?.trim()) req.first_name = values.first_name.trim()
  if (values.last_name?.trim()) req.last_name = values.last_name.trim()
  if (values.full_name?.trim()) req.full_name = values.full_name.trim()
  if (values.bio?.trim()) req.bio = values.bio.trim()
  if (values.tag_line?.trim()) req.tag_line = values.tag_line.trim()
  if (values.profile_picture?.trim())
    req.profile_picture = values.profile_picture.trim()
  if (values.is_top_speaker === true) req.is_top_speaker = true
  return req
}

export function AddSpeakerModal({
  open,
  onOpenChange,
  eventId,
}: AddSpeakerModalProps): React.ReactElement {
  const createSpeaker = useCreateSpeaker(eventId)

  const form = useForm<CreateSpeakerFormValues>({
    resolver: zodResolver(createSpeakerSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      createSpeaker.reset()
    }
  }, [open])

  const onSubmit = (values: CreateSpeakerFormValues) => {
    createSpeaker.mutate(toCreateSpeakerRequest(values), {
      onSuccess: () => {
        onOpenChange(false)
        form.reset(defaultValues)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Add speaker</DialogTitle>
          <DialogDescription>
            Add a new speaker for this event. At least a full name or first name
            is required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createSpeaker.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {createSpeaker.error instanceof Error
                  ? createSpeaker.error.message
                  : "Failed to add speaker"}
              </p>
            )}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Jane Doe"
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="tag_line"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag line</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Senior Engineer at Acme"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Short bio..."
                      rows={3}
                      className={cn(
                        "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
                        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profile_picture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile picture URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_top_speaker"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Top speaker</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Mark this speaker as a top / featured speaker
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createSpeaker.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSpeaker.isPending}>
                {createSpeaker.isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
