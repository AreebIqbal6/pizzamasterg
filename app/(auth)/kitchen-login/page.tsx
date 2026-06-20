import Image from "next/image"
import { kitchenLoginAction } from "@/app/actions/login"

export default async function KitchenLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/chef-logo-removebg-preview.png"
            alt="Pizza Master G"
            width={80}
            height={80}
            className="h-20 w-20 rounded-full bg-background object-contain p-1 ring-2 ring-accent"
          />
          <h1 className="mt-4 font-heading text-2xl font-bold text-accent">
            Kitchen Portal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access your branch dashboard
          </p>
        </div>

        <form action={kitchenLoginAction} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="email">Branch Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="branch@pizzamasterg.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-accent py-3 text-sm font-bold text-accent-foreground hover:opacity-90 transition"
          >
            Sign In
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-md bg-destructive/15 p-3 text-center text-sm font-medium text-destructive border border-destructive/30">
            {decodeURIComponent(error)}
          </div>
        )}
      </div>
    </div>
  )
}
