"use client";

import { Button, PageHeader } from "@ntrs/core";
import { UploadDropzone } from "@ntrs/meme";
import { AuthGuard } from "@/components/guards/auth-guard";
import { useUpload } from "./index.hook";

function UploadForm() {
  const {
    title,
    setTitle,
    previewUrl,
    dropzoneState,
    fileError,
    progress,
    submitError,
    isUploading,
    canSubmit,
    handleFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSubmit,
  } = useUpload();

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-12">
      <PageHeader title="Upload a meme" subtitle="JPEG, PNG, WEBP, or GIF — up to 5MB." />

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <UploadDropzone
            state={dropzoneState}
            previewUrl={previewUrl ?? undefined}
            error={fileError ?? undefined}
            accept="image/jpeg,image/png,image/webp,image/gif"
            maxSizeMb={5}
            onFile={handleFile}
          />
        </div>

        {isUploading && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button type="submit" disabled={!canSubmit || isUploading}>
          {isUploading ? `Uploading… ${progress}%` : "Upload"}
        </Button>
      </form>
    </div>
  );
}

export default function UploadLayout() {
  return (
    <AuthGuard>
      <UploadForm />
    </AuthGuard>
  );
}
