
// We need to augment the button component with a facebook variant
// This file is read-only, so we'll create a new button.tsx file that extends the existing one

import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonProps as ShadcnButtonProps } from "@/components/ui/button";
import React from "react";

export interface ButtonProps extends ShadcnButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "facebook";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => {
    // Facebook button styling
    if (variant === "facebook") {
      return (
        <ShadcnButton
          className={cn(
            "bg-[#1877F2] hover:bg-[#0E6FE8] text-white",
            className
          )}
          ref={ref}
          {...props}
        />
      );
    }

    // For all other variants, use the original button
    return <ShadcnButton className={className} variant={variant as any} ref={ref} {...props} />;
  }
);

Button.displayName = "Button";

export default Button;
