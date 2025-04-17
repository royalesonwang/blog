"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormField as FormFieldType, FormSubmit } from "@/types/blocks/form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import Icon from "@/components/icon";
import MarkdownEditor from "../editor/markdown";
import CoverImageSelector from "@/components/blocks/coverimage/CoverImageSelector";

// Function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except whitespace and hyphen
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with a single hyphen
    .trim();                   // Trim leading/trailing spaces or hyphens
};

// Reused from form/index.tsx
function buildFieldSchema(field: FormFieldType) {
  let schema = z.string();

  if (field.validation?.required) {
    schema = schema.min(1, {
      message: field.validation.message || `${field.title} is required`,
    });
  }

  if (field.validation?.min) {
    schema = schema.min(field.validation.min, {
      message:
        field.validation.message ||
        `${field.title} must be at least ${field.validation.min} characters`,
    });
  }

  if (field.validation?.max) {
    schema = schema.max(field.validation.max, {
      message:
        field.validation.message ||
        `${field.title} must be at most ${field.validation.max} characters`,
    });
  }

  if (field.validation?.email) {
    schema = schema.email({
      message:
        field.validation.message || `${field.title} must be a valid email`,
    });
  }

  return schema;
}

const generateFormSchema = (fields: FormFieldType[]) => {
  const schemaFields: Record<string, any> = {};

  fields.forEach((field) => {
    if (field.name) {
      schemaFields[field.name] = buildFieldSchema(field);
    }
  });

  return z.object(schemaFields);
};

export default function PostForm({
  fields,
  data,
  passby,
  submit,
  loading,
}: {
  fields?: FormFieldType[];
  data?: any;
  passby?: any;
  submit?: FormSubmit;
  loading?: boolean;
}) {
  if (!fields) {
    fields = [];
  }

  const router = useRouter();
  const FormSchema = generateFormSchema(fields);
  const defaultValues: Record<string, string> = {};

  fields.forEach((field) => {
    if (field.name) {
      defaultValues[field.name] = data?.[field.name] || field.value || "";
    }
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  // Handler for title blur event to generate slug
  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const titleValue = e.target.value;
    
    // Always generate a new slug when title field loses focus and has value
    if (titleValue) {
      const newSlug = generateSlug(titleValue);
      form.setValue("slug", newSlug);
    }
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!submit?.handler) return;

    try {
      console.log("Form data before submit:", data);
      
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        console.log(`Adding to FormData: ${key} = ${value}`);
        formData.append(key, value);
      });

      const res = await submit.handler(formData, passby);

      if (!res) {
        throw new Error("No response received from server");
      }

      if (res.message) {
        if (res.status === "success") {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      }

      if (res.redirect_url) {
        router.push(res.redirect_url);
      }
    } catch (err: any) {
      console.log("submit form error", err);
      toast.error(err.message || "submit form failed");
    }
  }

  // Separate fields for better rendering
  const markdownField = fields.find(item => item.type === "markdown_editor");
  
  // Filter out the cover_url field as we'll render it separately
  const regularFields = fields.filter(
    item => item.type !== "markdown_editor" && item.name !== "cover_url"
  );
  
  // Extract description and insert cover image after it
  const beforeCoverFields = regularFields.filter(
    item => item.name !== "description"
  );
  const descriptionField = regularFields.find(
    item => item.name === "description"
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-5xl space-y-6 px-2 pb-8"
      >
        <div className="space-y-4">
          {/* Regular form fields */}
          {beforeCoverFields.map((item, index) => (
            <div key={index} className="w-full max-w-md">
              <FormField
                control={form.control}
                name={item.name || ""}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {item.title}
                      {item.validation?.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      {item.type === "textarea" ? (
                        <Textarea
                          {...field}
                          placeholder={item.placeholder}
                          className="resize-none"
                          {...item.attributes}
                        />
                      ) : item.type === "select" ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          {...item.attributes}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={item.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {item.options?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          {...field}
                          type={item.type || "text"}
                          placeholder={item.placeholder}
                          {...item.attributes}
                          // Add onBlur handler for title field
                          {...(item.name === "title" ? { onBlur: handleTitleBlur } : {})}
                        />
                      )}
                    </FormControl>
                    {item.tip && (
                      <FormDescription
                        dangerouslySetInnerHTML={{ __html: item.tip }}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          {/* Description field */}
          {descriptionField && (
            <div className="w-full max-w-md">
              <FormField
                control={form.control}
                name={descriptionField.name || ""}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {descriptionField.title}
                      {descriptionField.validation?.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={descriptionField.placeholder}
                        className="resize-none"
                        {...descriptionField.attributes}
                      />
                    </FormControl>
                    {descriptionField.tip && (
                      <FormDescription
                        dangerouslySetInnerHTML={{ __html: descriptionField.tip }}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Cover Image Selector */}
          <div className="w-full max-w-md">
            <FormField
              control={form.control}
              name="cover_url"
              render={({ field }) => {
                console.log("Rendering CoverImageSelector with value:", field.value);
                return (
                  <FormItem>
                    <FormLabel>
                      Cover Image
                    </FormLabel>
                    <FormControl>
                      <CoverImageSelector
                        value={field.value}
                        onChange={(newValue) => {
                          console.log("CoverImageSelector onChange called with:", newValue);
                          field.onChange(newValue);
                          // Explicitly set the value in the form
                          form.setValue("cover_url", newValue);
                        }}
                        placeholder="Cover Image URL"
                        error={form.formState.errors.cover_url?.message as string}
                        defaultFolder="cover_image"
                      />
                    </FormControl>
                    <FormDescription>
                      You can upload a new image or select from existing images in cloud storage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          {/* Markdown editor */}
          {markdownField && (
            <div className="w-full mt-6">
              <FormField
                control={form.control}
                name={markdownField.name || ""}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      {markdownField.title}
                      {markdownField.validation?.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <MarkdownEditor
                        value={field.value}
                        onChange={field.onChange}
                        slug={form.watch("slug") || "default"}
                      />
                    </FormControl>
                    {markdownField.tip && (
                      <FormDescription
                        dangerouslySetInnerHTML={{ __html: markdownField.tip }}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {submit?.button && (
          <Button
            type="submit"
            variant={submit.button.variant}
            className="flex items-center justify-center gap-2 font-semibold mt-6"
            disabled={loading}
          >
            {submit.button.title}
            {loading ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              submit.button.icon && (
                <Icon name={submit.button.icon} className="size-4" />
              )
            )}
          </Button>
        )}
      </form>
    </Form>
  );
} 