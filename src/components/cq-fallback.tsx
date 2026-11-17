import { useEffect } from "react";
import { installContainerFallback } from "@/lib/cq-polyfill";

/** Old Safari (no container units / dvh): fills the size variables the stylesheet reads. */
export function CqFallback() {
  useEffect(() => {
    installContainerFallback();
  }, []);
  return null;
}
