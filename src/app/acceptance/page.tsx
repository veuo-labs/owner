import { Suspense } from "react";
import AcceptanceContent from "./client";

export default function AcceptancePage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AcceptanceContent token={searchParams.token || ""} />
    </Suspense>
  );
}
