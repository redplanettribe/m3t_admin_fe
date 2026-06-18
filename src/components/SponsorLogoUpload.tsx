import * as React from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useConfirmSponsorLogo,
  useRequestSponsorLogoUpload,
} from "@/hooks/useSponsors"

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number]

type SponsorLogoUploadProps = {
  eventId: string | null
  sponsorId: string | null
  existingImageUrl?: string
  disabled?: boolean
  onUploadComplete?: () => void
}

function isAllowedContentType(type: string): type is AllowedContentType {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(type)
}

export function SponsorLogoUpload({
  eventId,
  sponsorId,
  existingImageUrl,
  disabled,
  onUploadComplete,
}: SponsorLogoUploadProps): React.ReactElement {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const requestUpload = useRequestSponsorLogoUpload(eventId, sponsorId)
  const confirmLogo = useConfirmSponsorLogo(eventId, sponsorId)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  const uploading = isUploading || requestUpload.isPending || confirmLogo.isPending

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const displayUrl = previewUrl ?? existingImageUrl

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setError(null)

    if (!isAllowedContentType(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image.")
      return
    }

    setIsUploading(true)
    try {
      const { key, upload_url } = await requestUpload.mutateAsync({
        content_type: file.type,
      })
      const res = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!res.ok) {
        throw new Error("Failed to upload image. Please try again.")
      }

      await confirmLogo.mutateAsync({ key })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
      onUploadComplete?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload logo."
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Sponsor logo"
            className="h-16 w-16 rounded-md border bg-muted object-contain"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-muted-foreground">
            <Upload className="size-5" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={disabled || uploading || !eventId || !sponsorId}
          >
            {uploading ? "Uploading…" : displayUrl ? "Change logo" : "Upload logo"}
          </Button>
          <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP.</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
}
