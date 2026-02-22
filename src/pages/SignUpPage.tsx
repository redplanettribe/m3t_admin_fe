import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { ControllerRenderProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
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
import { useSignUp } from "@/hooks/useSignUp"
import { signUpSchema, type SignUpFormValues } from "@/lib/schemas/auth"
import { useUserStore } from "@/store/userStore"
import type { SignUpRequest } from "@/types/auth"
import { cn } from "@/lib/utils"

function PasswordWithToggle({
  field,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  placeholder,
}: {
  field: ControllerRenderProps<SignUpFormValues, "password" | "confirmPassword">
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  placeholder?: string
}) {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        type={show ? "text" : "password"}
        className="pr-9"
        placeholder={placeholder}
        {...field}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </Button>
    </div>
  )
}

export function SignUpPage(): React.ReactElement {
  const navigate = useNavigate()
  const clearAuth = useUserStore((s) => s.clearAuth)
  const signUp = useSignUp()

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = (values: SignUpFormValues) => {
    const payload: SignUpRequest = {
      email: values.email,
      name: values.name,
      password: values.password,
      role: "admin",
    }
    signUp.mutate(payload, {
      onSuccess: () => {
        clearAuth()
        navigate("/login", { replace: true })
      },
    })
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground text-sm">
          Enter your details to sign up.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {signUp.isError && (
            <p
              className={cn(
                "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              )}
              role="alert"
            >
              {signUp.error instanceof Error ? signUp.error.message : "Sign-up failed"}
            </p>
          )}
          <FormField
            control={form.control}
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
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordWithToggle
                    field={field}
                    placeholder="At least 8 characters"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordWithToggle
                    field={field}
                    placeholder="Confirm your password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={signUp.isPending}>
            {signUp.isPending ? "Signing up…" : "Sign up"}
          </Button>
        </form>
      </Form>
      <p className="text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link to="/login" className="underline hover:text-foreground">
          Log in
        </Link>
      </p>
    </div>
  )
}
