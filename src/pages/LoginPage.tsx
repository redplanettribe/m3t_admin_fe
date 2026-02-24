import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { useRequestLoginCode } from "@/hooks/useRequestLoginCode"
import { useVerifyLoginCode } from "@/hooks/useVerifyLoginCode"
import { userFromToken } from "@/lib/jwt"
import {
  requestLoginCodeSchema,
  verifyLoginCodeSchema,
  type RequestLoginCodeFormValues,
  type VerifyLoginCodeFormValues,
} from "@/lib/schemas/auth"
import { useUserStore } from "@/store/userStore"
import { cn } from "@/lib/utils"

export function LoginPage(): React.ReactElement {
  const navigate = useNavigate()
  const setAuth = useUserStore((s) => s.setAuth)
  const [emailSentTo, setEmailSentTo] = React.useState<string | null>(null)

  const requestCode = useRequestLoginCode()
  const verifyCode = useVerifyLoginCode()

  const requestForm = useForm<RequestLoginCodeFormValues>({
    resolver: zodResolver(requestLoginCodeSchema),
    defaultValues: { email: "" },
  })

  const verifyForm = useForm<VerifyLoginCodeFormValues>({
    resolver: zodResolver(verifyLoginCodeSchema),
    defaultValues: { email: "", code: "" },
  })

  const onRequestCode = (values: RequestLoginCodeFormValues) => {
    requestCode.mutate(values, {
      onSuccess: () => {
        setEmailSentTo(values.email)
        verifyForm.reset({ email: values.email, code: "" })
      },
    })
  }

  const onVerifyCode = (values: VerifyLoginCodeFormValues) => {
    verifyCode.mutate(values, {
      onSuccess: (data) => {
        const user = data.user ?? userFromToken(data.token)
        if (user) setAuth(user, data.token)
        navigate("/", { replace: true })
      },
    })
  }

  const handleResendCode = () => {
    if (!emailSentTo) return
    requestCode.mutate(
      { email: emailSentTo },
      {
        onSuccess: () => {
          verifyForm.setValue("code", "")
          verifyForm.clearErrors("code")
        },
      }
    )
  }

  const backToEmail = () => {
    setEmailSentTo(null)
    requestCode.reset()
    verifyCode.reset()
    verifyForm.reset()
  }

  const isStep2 = emailSentTo !== null
  const error: string | null = isStep2
    ? verifyCode.isError
      ? verifyCode.error instanceof Error
        ? verifyCode.error.message
        : "Invalid or expired code"
      : null
    : requestCode.isError
      ? requestCode.error instanceof Error
        ? requestCode.error.message
        : "Something went wrong"
      : null

  if (isStep2) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-muted-foreground text-sm">
            We sent a code to <strong>{emailSentTo}</strong>. Enter it below.
          </p>
        </div>
        <Form {...verifyForm}>
          <form
            onSubmit={verifyForm.handleSubmit(onVerifyCode)}
            className="space-y-4"
          >
            <FormField
              control={verifyForm.control}
              name="email"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            {error && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {error}
              </p>
            )}
            <FormField
              control={verifyForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter the code from your email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={verifyCode.isPending}
            >
              {verifyCode.isPending ? "Verifying…" : "Log in"}
            </Button>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                disabled={requestCode.isPending}
                onClick={handleResendCode}
              >
                {requestCode.isPending ? "Sending…" : "Resend code"}
              </Button>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={backToEmail}
              >
                Use a different email
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="text-muted-foreground text-sm">
          We&apos;ll send you a code to sign in. Enter your email.
        </p>
      </div>
      <Form {...requestForm}>
        <form
          onSubmit={requestForm.handleSubmit(onRequestCode)}
          className="space-y-4"
        >
          {error && (
            <p
              className={cn(
                "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              )}
              role="alert"
            >
              {error}
            </p>
          )}
          <FormField
            control={requestForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={requestCode.isPending}
          >
            {requestCode.isPending ? "Sending code…" : "Continue"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
