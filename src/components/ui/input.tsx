import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, error, ...props }: React.ComponentProps<"input"> & { error?: string | boolean }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-theme-primary focus-visible:ring-theme-primary/20 focus-visible:ring-[2px]",
        "aria-invalid:ring-destructive/10 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
