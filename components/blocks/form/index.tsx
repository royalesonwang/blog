"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormField as FormFieldType, FormSubmit } from "@/types/blocks/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import MarkdownEditor from "../editor/markdown";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

export default function ({
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

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!submit?.handler) return;

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
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

  // 分离 markdown_editor 和其他表单项
  const markdownField = fields.find(item => item.type === "markdown_editor");
  const otherFields = fields.filter(item => item.type !== "markdown_editor");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-5xl space-y-6 px-2 pb-8"
      >
        <div className="space-y-4">
          {/* 先显示其他普通表单项 */}
          {otherFields.map((item, index) => (
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
                      ) : item.type === "custom" && item.component ? (
                        <item.component
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={item.placeholder}
                          error={form.formState.errors[item.name || ""]?.message}
                          {...item.attributes}
                        />
                      ) : (
                        <Input
                          {...field}
                          type={item.type || "text"}
                          placeholder={item.placeholder}
                          {...item.attributes}
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

          {/* 然后显示 Markdown 编辑器 */}
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
