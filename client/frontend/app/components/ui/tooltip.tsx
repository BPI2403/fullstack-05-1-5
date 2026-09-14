import * as React from "react";
import {
  Provider as TooltipProviderPrimitive,
  Root as TooltipPrimitiveRoot,
  Trigger as TooltipPrimitiveTrigger,
  Content as TooltipPrimitiveContent,
  Arrow as TooltipPrimitiveArrow,
} from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipProviderPrimitive;

const Tooltip = TooltipPrimitiveRoot;

const TooltipTrigger = TooltipPrimitiveTrigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitiveContent>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitiveContent>
>(({ className, children, ...props }, ref) => (
  <TooltipPrimitiveContent
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md",
      className,
    )}
    {...props}
  >
    {children}
    <TooltipPrimitiveArrow asChild>
      <div
        className="fill-popover"
        style={{
          width: "var(--radix-tooltip-content-width)",
          height: "var(--radix-tooltip-content-height)",
        }}
      />
    </TooltipPrimitiveArrow>
  </TooltipPrimitiveContent>
));
TooltipContent.displayName = TooltipPrimitiveContent.displayName;

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
};
