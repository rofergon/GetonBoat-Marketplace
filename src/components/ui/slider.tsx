"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex items-center rounded-full slider",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="h-1 w-full relative overflow-hidden rounded-full slider-track">
      <SliderPrimitive.Range className="absolute h-full slider-range" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="h-4 w-4 block rounded-full border-2 slider-thumb border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
