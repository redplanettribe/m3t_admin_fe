import * as React from "react"
import { Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRequestSpeakerProfilePictureUpload } from "@/hooks/useSpeakers"

type SpeakerProfilePictureUploadProps = {
  eventId: string | null
  value: string
  onChange: (key: string) => void
  existingImageUrl?: string
  disabled?: boolean
  fallbackInitials?: string
  onUploadingChange?: (uploading: boolean) => void
}

export function SpeakerProfilePictureUpload({
  eventId,
  value,
  onChange,
  existingImageUrl,
  disabled,
  fallbackInitials = "?",
  onUploadingChange,
}: SpeakerProfilePictureUploadProps): React.ReactElement {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const requestUpload = useRequestSpeakerProfilePictureUpload(eventId)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  const uploading = isUploading || requestUpload.isPending

  React.useEffect(() => {
    onUploadingChange?.(uploading)
  }, [uploading, onUploadingChange])

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  React.useEffect(() => {
    if (!value && previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [value, previewUrl])

  const displayUrl = previewUrl ?? existingImageUrl

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setError(null)

    if (file.type !== "image/jpeg") {
      setError("Please select a JPEG image (.jpg).")
      return
    }

    setIsUploading(true)
    try {
      const { key, upload_url } = await requestUpload.mutateAsync()
      const res = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "image/jpeg",
        },
      })

      if (!res.ok) {
        throw new Error("Failed to upload image. Please try again.")
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
      onChange(key)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload picture."
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        {displayUrl ? (
          <AvatarImage
            src={displayUrl}
            alt="Speaker profile"
            className="object-cover"
          />
        ) : null}
        <AvatarFallback>{fallbackInitials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleButtonClick}
          disabled={disabled || uploading}
        >
          <Upload className="size-4" />
          {uploading
            ? "Uploading…"
            : displayUrl
              ? "Change picture"
              : "Upload picture"}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
