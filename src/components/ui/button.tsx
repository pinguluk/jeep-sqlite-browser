import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-devtools-accent-blue text-black hover:opacity-90",
                destructive: "bg-devtools-accent-red text-white hover:opacity-90",
                outline: "border border-devtools-border bg-transparent hover:bg-devtools-bg-hover",
                secondary: "bg-devtools-bg-tertiary text-devtools-text-primary hover:bg-devtools-bg-hover",
                ghost: "hover:bg-devtools-bg-hover",
                link: "text-devtools-accent-blue underline-offset-4 hover:underline",
            },
            size: {
                default: "h-7 px-3 py-1",
                sm: "h-6 px-2",
                lg: "h-8 px-4",
                icon: "h-7 w-7",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
