'use client'

/**
 * P0-22 — layout from 21st.dev "Login with Email and Password"
 * (https://21st.dev/@ephraimduncan/components/login-03, MIT; SSO/social
 * variants rejected by policy, TanStack-Form variant rejected — outside the
 * stack). Rebuilt on react-hook-form + the shared Zod schemas with the §3.5
 * conventions: labels above, blur validation then re-validate on change,
 * specific error text, error summary on submit, single column, submit
 * disabled only while submitting. Magic-link sign-in is a tab, junior
 * registrations reveal mandatory guardian fields from the date of birth.
 */

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ErrorSummary, Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  isJuniorDob,
  magicLinkSchema,
  signInSchema,
  signUpSchema,
  type MagicLinkValues,
  type SignInValues,
  type SignUpValues,
} from '@/lib/schemas/auth'

const formMode = { mode: 'onBlur', reValidateMode: 'onChange' } as const

export function SignInForm({
  onPassword,
  onMagicLink,
}: {
  onPassword: (values: SignInValues) => Promise<void>
  onMagicLink: (values: MagicLinkValues) => Promise<void>
}) {
  const pw = useForm<SignInValues>({ resolver: zodResolver(signInSchema), ...formMode })
  const magic = useForm<MagicLinkValues>({ resolver: zodResolver(magicLinkSchema), ...formMode })

  return (
    <div className="w-full max-w-md rounded-xl border border-stone bg-card p-6 sm:p-8">
      <h1 className="text-2xl">Log in</h1>
      <Tabs defaultValue="password" className="mt-4">
        <TabsList className="w-full">
          <TabsTrigger value="password" className="flex-1">
            Password
          </TabsTrigger>
          <TabsTrigger value="magic" className="flex-1">
            Email me a link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password">
          <form
            noValidate
            onSubmit={pw.handleSubmit((v) => onPassword(v))}
            className="mt-2 grid gap-4"
          >
            <ErrorSummary
              errors={Object.values(pw.formState.errors)
                .map((e) => e.message ?? '')
                .filter(Boolean)}
            />
            <Field label="Email" htmlFor="signin-email" error={pw.formState.errors.email?.message}>
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                aria-invalid={!!pw.formState.errors.email}
                {...pw.register('email')}
              />
            </Field>
            <Field
              label="Password"
              htmlFor="signin-password"
              error={pw.formState.errors.password?.message}
            >
              <Input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!pw.formState.errors.password}
                {...pw.register('password')}
              />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pw.formState.isSubmitting}>
                {pw.formState.isSubmitting ? 'Logging in…' : 'Log in'}
              </Button>
              <Button asChild variant="ghost">
                <Link href="/forgot-password">Forgotten password?</Link>
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="magic">
          <form
            noValidate
            onSubmit={magic.handleSubmit((v) => onMagicLink(v))}
            className="mt-2 grid gap-4"
          >
            <Field
              label="Email"
              htmlFor="magic-email"
              helper="We'll send a one-tap login link — no password needed."
              error={magic.formState.errors.email?.message}
            >
              <Input
                id="magic-email"
                type="email"
                autoComplete="email"
                aria-invalid={!!magic.formState.errors.email}
                {...magic.register('email')}
              />
            </Field>
            <div>
              <Button type="submit" disabled={magic.formState.isSubmitting}>
                {magic.formState.isSubmitting ? 'Sending…' : 'Send login link'}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
      <p className="mt-6 border-t border-stone pt-4 text-sm text-ink-muted">
        Not a member yet?{' '}
        <Link href="/join" className="font-medium text-river underline-offset-4 hover:underline">
          Join the club
        </Link>
      </p>
    </div>
  )
}

export function SignUpForm({ onSubmit }: { onSubmit: (values: SignUpValues) => Promise<void> }) {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    ...formMode,
    defaultValues: { acceptRules: false, acceptRisk: false, acceptPrivacy: false },
  })
  const { errors, isSubmitting } = form.formState
  // useWatch (a real subscription hook) rather than form.watch — the latter's
  // return value is a React Compiler stale-UI hazard, and this one gates the
  // junior guardian fields appearing.
  const dob = useWatch({ control: form.control, name: 'dateOfBirth' })
  const junior = !!dob && isJuniorDob(dob)

  const err = (k: keyof SignUpValues) => errors[k]?.message as string | undefined

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) => onSubmit(v))}
      className="grid w-full max-w-md gap-4"
    >
      <ErrorSummary
        errors={Object.values(errors)
          .map((e) => e?.message ?? '')
          .filter(Boolean)}
      />

      <Field label="First name" htmlFor="su-first" error={err('firstName')}>
        <Input id="su-first" autoComplete="given-name" aria-invalid={!!errors.firstName} {...form.register('firstName')} />
      </Field>
      <Field label="Last name" htmlFor="su-last" error={err('lastName')}>
        <Input id="su-last" autoComplete="family-name" aria-invalid={!!errors.lastName} {...form.register('lastName')} />
      </Field>
      <Field label="Email" htmlFor="su-email" error={err('email')}>
        <Input id="su-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register('email')} />
      </Field>
      <Field
        label="Password"
        htmlFor="su-password"
        helper="At least 10 characters — a short sentence works well."
        error={err('password')}
      >
        <Input id="su-password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register('password')} />
      </Field>
      <Field
        label="Date of birth"
        htmlFor="su-dob"
        helper="Used to tell junior and adult membership apart."
        error={err('dateOfBirth')}
      >
        <Input id="su-dob" type="date" autoComplete="bday" aria-invalid={!!errors.dateOfBirth} {...form.register('dateOfBirth')} />
      </Field>

      {junior && (
        <div className="grid gap-4 rounded-lg border border-river/40 bg-foam p-4">
          <p className="text-sm font-medium">
            Under-18s need a parent or guardian on record
          </p>
          <Field label="Parent or guardian's name" htmlFor="su-guardian" error={err('guardianName')}>
            <Input id="su-guardian" aria-invalid={!!errors.guardianName} {...form.register('guardianName')} />
          </Field>
          <Field
            label="Parent or guardian's phone"
            htmlFor="su-guardian-phone"
            error={err('guardianPhone')}
          >
            <Input id="su-guardian-phone" type="tel" aria-invalid={!!errors.guardianPhone} {...form.register('guardianPhone')} />
          </Field>
        </div>
      )}

      <Field label="Phone" htmlFor="su-phone" error={err('phone')}>
        <Input id="su-phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...form.register('phone')} />
      </Field>
      <Field label="Address line 1" htmlFor="su-addr1" error={err('addressLine1')}>
        <Input id="su-addr1" autoComplete="address-line1" aria-invalid={!!errors.addressLine1} {...form.register('addressLine1')} />
      </Field>
      <Field label="Address line 2" htmlFor="su-addr2" optional error={err('addressLine2')}>
        <Input id="su-addr2" autoComplete="address-line2" {...form.register('addressLine2')} />
      </Field>
      <Field label="Town" htmlFor="su-town" error={err('town')}>
        <Input id="su-town" autoComplete="address-level2" aria-invalid={!!errors.town} {...form.register('town')} />
      </Field>
      <Field
        label="Postcode"
        htmlFor="su-postcode"
        helper="Like TF8 7HJ"
        error={err('postcode')}
      >
        <Input id="su-postcode" autoComplete="postal-code" aria-invalid={!!errors.postcode} className="max-w-40" {...form.register('postcode')} />
      </Field>
      <Field
        label="Paddle UK membership number"
        htmlFor="su-bc"
        optional
        helper="Formerly British Canoeing — add it later if you don't know it."
        error={err('bcNumber')}
      >
        <Input id="su-bc" aria-invalid={!!errors.bcNumber} {...form.register('bcNumber')} />
      </Field>

      <fieldset className="grid gap-3 rounded-lg border border-stone p-4">
        <legend className="px-1 text-sm font-medium">Agreements</legend>
        {(
          [
            ['acceptRules', 'I accept the club rules and constitution'],
            ['acceptRisk', 'I understand paddlesport carries risk and accept the risk statement'],
            ['acceptPrivacy', 'I accept the privacy policy'],
          ] as const
        ).map(([name, label]) => (
          <div key={name} className="grid gap-1">
            {/* Controller (not bare form.watch) so the checkbox re-renders on
                change — form.watch's value is a React Compiler stale-UI hazard
                when read straight into a memoised child. */}
            <Controller
              control={form.control}
              name={name}
              render={({ field }) => (
                <label className="flex min-h-11 items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={field.value === true}
                    aria-invalid={!!errors[name]}
                    onBlur={field.onBlur}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  {label}
                </label>
              )}
            />
            {errors[name]?.message && (
              <p className="text-sm text-signal" role="alert">
                {errors[name]?.message}
              </p>
            )}
          </div>
        ))}
      </fieldset>

      <div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </div>
    </form>
  )
}
