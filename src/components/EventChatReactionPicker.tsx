import * as React from "react"
import { SmilePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { QUICK_REACTION_EMOJIS } from "@/lib/chatUtils"

type EventChatReactionPickerProps = {
  onSelect: (emoji: string) => void
  disabled?: boolean
}

export function EventChatReactionPicker({
  onSelect,
  disabled,
}: EventChatReactionPickerProps): React.ReactElement {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (emoji: string) => {
    onSelect(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Add reaction"
          disabled={disabled}
        >
          <SmilePlus className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="center" side="top">
        <div className="grid grid-cols-6 gap-1">
          {QUICK_REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="hover:bg-muted flex size-9 items-center justify-center rounded-md text-xl transition-colors"
              aria-label={`React with ${emoji}`}
              onClick={() => handleSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
