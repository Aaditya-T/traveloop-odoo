import { Suspense } from "react";
import { SearchParamsToasts } from "@/components/search-params-toasts";

export function SearchParamsToastsBoundary() {
  return (
    <Suspense fallback={null}>
      <SearchParamsToasts />
    </Suspense>
  );
}
