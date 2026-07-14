"use client";

import Link from "next/link";
import { Button, PageHeader } from "@ntrs/core";
import { MemeCard } from "@ntrs/meme";
import { AuthGuard } from "@/components/guards/auth-guard";
import { useMyMemes } from "./index.hook";

function MyMemesGrid() {
  const { memes, isLoading, error, handleDelete } = useMyMemes();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <PageHeader
        title="My memes"
        subtitle="Everything you've uploaded."
        action={
          <Link href="/upload">
            <Button>Upload another</Button>
          </Link>
        }
      />

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {isLoading && memes.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && !error && memes.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          No memes yet. <Link href="/upload" className="underline">Upload your first one</Link>.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {memes.map((meme) => (
          <div key={meme.id} className="flex flex-col gap-2">
            <MemeCard title={meme.title} imageUrl={meme.imageUrl} rating={meme.rating} record={meme.record} />
            <Button variant="destructive" size="sm" onClick={() => handleDelete(meme.id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyMemesLayout() {
  return (
    <AuthGuard>
      <MyMemesGrid />
    </AuthGuard>
  );
}
