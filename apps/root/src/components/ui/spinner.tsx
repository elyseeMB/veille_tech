import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import type React from "react";

function Spinner({ className, ref, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
