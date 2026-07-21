import { Suspense } from "react";
import ResetPasswordLayout from "@/layout/reset-password";

export default function ResetPasswordPage() {
  // useSearchParams (for ?token=) requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <ResetPasswordLayout />
    </Suspense>
  );
}
