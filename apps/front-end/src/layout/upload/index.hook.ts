import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { uploadMeme, clearMemesData } from "@/store/slices/memes.slice";
import { useAsyncAction } from "@/hooks/use-async-action";
import { getErrorMessage } from "@/lib/errors";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

type DropzoneState = "idle" | "dragover" | "preview" | "error";

export function useUpload() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dropzoneState, setDropzoneState] = useState<DropzoneState>("idle");
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Revoke the previous object URL whenever it's replaced or the page unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (selected: File) => {
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFileError("Please upload a JPEG, PNG, WEBP, or GIF image.");
      setDropzoneState("error");
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large — max ${MAX_SIZE_MB}MB.`);
      setDropzoneState("error");
      return;
    }
    setFileError(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setDropzoneState("preview");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropzoneState("dragover");
  };

  const handleDragLeave = () => {
    setDropzoneState(file ? "preview" : "idle");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const [submit, isUploading] = useAsyncAction(
    async () => {
      if (!file) throw new Error("No file selected");
      const result = await dispatch(
        uploadMeme({ data: { title, file }, onUploadProgress: setProgress })
      ).unwrap();
      return result;
    },
    {
      onSuccess: () => {
        dispatch(clearMemesData());
        router.push("/my-memes");
      },
      onError: (err) => setSubmitError(typeof err === "string" ? err : getErrorMessage()),
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    submit();
  };

  return {
    title,
    setTitle,
    previewUrl,
    dropzoneState,
    fileError,
    progress,
    submitError,
    isUploading,
    canSubmit: Boolean(file) && title.trim().length > 0,
    handleFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSubmit,
  };
}
