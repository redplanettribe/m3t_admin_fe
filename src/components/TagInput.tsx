import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface TagInputProps {
  /** Available tags from the API. */
  suggestions: string[]
  /** Currently selected tag names. */
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
}

export function TagInput({
  suggestions,
  value,
  onChange,
  placeholder = "Add a tag…",
  disabled = false,
  isLoading = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [highlightIndex, setHighlightIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filtered = inputValue.trim()
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(inputValue.trim().toLowerCase()) &&
          !value.includes(s)
      )
    : suggestions.filter((s) => !value.includes(s))

  const trimmed = inputValue.trim()
  const exactMatch = suggestions.some(
    (s) => s.toLowerCase() === trimmed.toLowerCase()
  )
  const alreadySelected = value.some(
    (v) => v.toLowerCase() === trimmed.toLowerCase()
  )
  const showCreateOption =
    trimmed.length > 0 && !exactMatch && !alreadySelected

  const options = [
    ...filtered,
    ...(showCreateOption ? [`__create__${trimmed}`] : []),
  ]

  React.useEffect(() => {
    setHighlightIndex(-1)
  }, [inputValue])

  function addTag(tag: string) {
    if (!tag || value.includes(tag)) return
    onChange([...value, tag])
    setInputValue("")
    setOpen(false)
    inputRef.current?.focus()
  }

  function removeTag(tag: string) {
    onChange(value.filter((v) => v !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightIndex >= 0 && highlightIndex < options.length) {
        const opt = options[highlightIndex]
        addTag(opt.startsWith("__create__") ? opt.slice(10) : opt)
      } else if (trimmed && !alreadySelected) {
        addTag(trimmed)
      }
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1 text-sm">
      <span className="font-medium">Tags</span>
      <div
        className={cn(
          "flex flex-wrap gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[80px] bg-transparent outline-none placeholder:text-muted-foreground text-sm py-0.5"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150)
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
        />
      </div>
      {open && options.length > 0 && (
        <div className="relative">
          <div className="absolute z-50 top-0 left-0 right-0 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
            {isLoading && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Loading tags…
              </div>
            )}
            {options.map((opt, i) => {
              const isCreate = opt.startsWith("__create__")
              const label = isCreate ? opt.slice(10) : opt
              return (
                <button
                  key={opt}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    i === highlightIndex && "bg-accent text-accent-foreground"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    addTag(label)
                  }}
                  onMouseEnter={() => setHighlightIndex(i)}
                >
                  {isCreate ? (
                    <>
                      Create &ldquo;{label}&rdquo;
                    </>
                  ) : (
                    label
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
