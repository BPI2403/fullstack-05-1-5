import * as React from "react";
import {
  Root as DropdownMenuPrimitiveRoot,
  Trigger as DropdownMenuPrimitiveTrigger,
  Portal as DropdownMenuPrimitivePortal,
  Content as DropdownMenuPrimitiveContent,
  Item as DropdownMenuItem,
  CheckboxItem as DropdownMenuCheckboxItem,
  Label as DropdownMenuLabel,
  Separator as DropdownMenuSeparator,
  Group as DropdownMenuGroup,
  Sub as DropdownMenuSub,
} from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitiveRoot;

const DropdownMenuTrigger = DropdownMenuPrimitiveTrigger;

const DropdownMenuPortal = ({ children, ...props }: DropdownMenuPortalProps) => (
  <DropdownMenuPrimitivePortal {...props}>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {children}
    </div>
  </DropdownMenuPrimitivePortal>
);
DropdownMenuPortal.displayName = "DropdownMenuPortal";

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitiveContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitiveContent>
>(({ className, children, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitivePortal>
    <DropdownMenuPrimitiveContent
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=delayed-open]:animate-in data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    >
      {children}
    </DropdownMenuPrimitiveContent>
  </DropdownMenuPrimitivePortal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitiveContent.displayName;

const dropdownItemClass =
  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  dropdownItemClass,
};

import type { ComponentPropsWithoutRef } from "react";
type DropdownMenuPortalProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitivePortal
> & { children: React.ReactNode };
