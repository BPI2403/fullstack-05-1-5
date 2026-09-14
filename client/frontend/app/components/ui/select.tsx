import * as React from "react";
import {
  Root as SelectPrimitiveRoot,
  Group as SelectPrimitiveGroup,
  Label as SelectPrimitiveLabel,
  Trigger as SelectPrimitiveTrigger,
  Value as SelectValue,
  Content as SelectPrimitiveContent,
  Item as SelectPrimitiveItem,
  ItemIndicator as SelectPrimitiveItemIndicator,
  ScrollUpButton as SelectPrimitiveScrollUpButton,
  ScrollDownButton as SelectPrimitiveScrollDownButton,
  Viewport as SelectViewport,
} from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitiveRoot;

const SelectGroup = React.forwardRef<
  React.ElementRef<typeof SelectPrimitiveGroup>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitiveGroup>
>(({ className, ...props }, ref) => (
  <SelectPrimitiveGroup ref={ref} className={cn(className)} {...props} />
));
SelectGroup.displayName = SelectPrimitiveGroup.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitiveLabel>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitiveLabel>
>(({ className, ...props }, ref) => (
  <SelectPrimitiveLabel
    ref={ref}
    className={cn(
      "py-1.5 pl-8 pr-2 text-xs font-semibold opacity-70",
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitiveLabel.displayName;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitiveTrigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitiveTrigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitiveTrigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
  </SelectPrimitiveTrigger>
));
SelectTrigger.displayName = SelectPrimitiveTrigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitiveContent>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitiveContent>
>(({ className, children,   position = "popper", ...props }, ref) => (
  <SelectPrimitiveContent
    ref={ref}
    position={position}
    className={cn(
      "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
  >
    <SelectPrimitiveScrollUpButton className="py-1.5 pl-8 pr-2 text-xs opacity-70">
      <ChevronDown className="h-4 w-4 rotate-180 opacity-50" />
    </SelectPrimitiveScrollUpButton>
    <SelectViewport>
      <SelectGroup className="py-1">{children}</SelectGroup>
    </SelectViewport>
    <SelectPrimitiveScrollDownButton className="py-1.5 pl-8 pr-2 text-xs opacity-70">
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitiveScrollDownButton>
  </SelectPrimitiveContent>
));
SelectContent.displayName = SelectPrimitiveContent.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitiveItem>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitiveItem>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitiveItem
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <SelectPrimitiveItemIndicator className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Check className="h-4 w-4" />
    </SelectPrimitiveItemIndicator>
    {children}
  </SelectPrimitiveItem>
));
SelectItem.displayName = SelectPrimitiveItem.displayName;

export {
  Select,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectViewport,
};
