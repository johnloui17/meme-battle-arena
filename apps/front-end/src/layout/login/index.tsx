"use client";

import Link from "next/link";
import { Button, PageHeader } from "@ntrs/core";
import { useLogin } from "./index.hook";

export default function LoginLayout() {
  const { email, setEmail, password, setPassword, error, isLoading, handleSubmit } = useLogin();

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <PageHeader title="Log in" subtitle="Welcome back to the arena." />

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        No account? <Link href="/register" className="underline">Register</Link>
      </p>
    </div>
  );
}
