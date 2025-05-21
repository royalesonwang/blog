"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressCircleVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden rounded-full",
  {
    variants: {
      size: {
        default: "h-10 w-10",
        sm: "h-8 w-8",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface ProgressCircleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressCircleVariants> {
  asChild?: boolean
  value: number
  max?: number
  getValueLabel?(value: number, max: number): string
  circleBackground?: string
  circleColor?: string
  strokeWidth?: number
}

const ProgressCircle = React.forwardRef<HTMLDivElement, ProgressCircleProps>(
  (
    {
      className,
      size,
      asChild = false,
      value = 0,
      max = 100,
      getValueLabel,
      circleBackground = "stroke-muted",
      circleColor = "stroke-primary",
      strokeWidth = 4,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div"
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const valueInPercent = value / max
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - valueInPercent * circumference
    
    const label = getValueLabel ? getValueLabel(value, max) : `${Math.round(valueInPercent * 100)}%`

    return (
      <Comp
        ref={ref}
        className={cn(progressCircleVariants({ size, className }))}
        {...props}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full rotate-[-90deg]">
          <circle
            className={circleBackground}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            className={cn(circleColor, "transition-all duration-300 ease-in-out")}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            style={{
              transition: "stroke-dashoffset 0.3s ease"
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {label}
        </div>
      </Comp>
    )
  }
)
ProgressCircle.displayName = "ProgressCircle"

export { ProgressCircle }
