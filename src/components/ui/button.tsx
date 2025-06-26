import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "gomutuo-button-primary",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 solid-shadow-light press-down-effect",
        outline:
          "gomutuo-button-secondary",
        secondary:
          "gomutuo-button-secondary",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-form-green underline-offset-4 hover:underline font-dm-sans",
        accent: "bg-accent-yellow text-form-green hover:bg-accent-yellow-alt shadow-[0_6px_12px_rgba(198,255,0,0.2)] hover:shadow-[0_8px_16px_rgba(198,255,0,0.25)] shadow-[0_3px_0_0_hsl(56_93%_56%)] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_hsl(56_93%_56%)] rounded-[12px] px-[32px] py-[16px] font-dm-sans font-medium",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
