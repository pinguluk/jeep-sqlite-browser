import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-7 w-full rounded border border-devtools-border bg-devtools-bg-tertiary px-2 py-1 text-xs text-devtools-text-primary placeholder:text-devtools-text-muted focus-visible:outline-none focus-visible:border-devtools-accent-blue disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
