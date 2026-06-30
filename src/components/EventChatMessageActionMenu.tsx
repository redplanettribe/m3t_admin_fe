import * as React from "react"
import { ChevronDown, Reply, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type EventChatMessageActionMenuProps = {
  showReply?: boolean
  showDelete?: boolean
  onReply?: () => void
  onDelete?: () => void
  isDeleting?: boolean
  align?: "start" | "end"
}

export function EventChatMessageActionMenu({
  showReply,
  showDelete,
  onReply,
  onDelete,
  isDeleting,
  align = "end",
}: EventChatMessageActionMenuProps): React.ReactElement | null {
  const [open, setOpen] = React.useState(false)

  if (!showReply && !showDelete) return null

  const handleReply = () => {
    onReply?.()
    setOpen(false)
  }

  const handleDelete = () => {
    onDelete?.()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className={cn(
            "absolute -top-2 -right-2 z-10 size-5 rounded-full shadow-sm",
            "opacity-0 transition-opacity group-hover:opacity-100",
            "data-[state=open]:opacity-100"
          )}
          aria-label="Message actions"
        >
          <ChevronDown className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align={align} side="bottom">
        {showReply && onReply && (
          <button
            type="button"
            className="hover:bg-muted flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
            onClick={handleReply}
          >
            <Reply className="size-3.5" />
            Reply
          </button>
        )}
        {showDelete && onDelete && (
          <button
            type="button"
            className="hover:bg-muted text-destructive flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
