"use client";

import { FormControl, FormItem, FormLabel, FormDescription, FormMessage, FormField } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import CoverImageSelector from "@/components/blocks/coverimage/CoverImageSelector";

interface CoverImageFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  tip?: string;
  required?: boolean;
}

export default function CoverImageField({
  name,
  label,
  placeholder,
  tip,
  required = false,
}: CoverImageFieldProps) {
  const { control, formState } = useFormContext();
  
  return (
    <div className="w-full max-w-md">
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <CoverImageSelector
                value={field.value}
                onChange={field.onChange}
                placeholder={placeholder}
                error={formState.errors[name]?.message as string}
              />
            </FormControl>
            {tip && (
              <FormDescription dangerouslySetInnerHTML={{ __html: tip }} />
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 