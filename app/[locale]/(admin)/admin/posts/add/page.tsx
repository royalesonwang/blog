import { PostStatus } from "@/models/post";
import { localeNames, locales } from "@/i18n/locale";

import Empty from "@/components/blocks/empty";
import PostFormSlot from "@/components/dashboard/slots/post-form";
import { Form as FormSlotType } from "@/types/slots/form";
import { getUserInfo } from "@/services/user";
import { addPost } from "./actions";
 

export default async function () {
  const user = await getUserInfo();
  if (!user || !user.uuid) {
    return <Empty message="no auth" />;
  }

  const form: FormSlotType = {
    title: "Add Post",
    crumb: {
      items: [
        {
          title: "Posts",
          url: "/admin/posts",
        },
        {
          title: "Add Post",
          is_active: true,
        },
      ],
    },
    fields: [
      {
        name: "title",
        title: "Title",
        type: "text",
        placeholder: "Post Title",
        validation: {
          required: true,
        },
      },
      {
        name: "slug",
        title: "Slug",
        type: "text",
        placeholder: "what-is-shipany",
        validation: {
          required: true,
        },
        tip: "post slug should be unique, visit like: /blog/what-is-shipany",
      },
      {
        name: "locale",
        title: "Locale",
        type: "select",
        options: locales.map((locale: string) => ({
          title: localeNames[locale],
          value: locale,
        })),
        value: "en",
        validation: {
          required: true,
        },
      },
      {
        name: "status",
        title: "Status",
        type: "select",
        options: Object.values(PostStatus).map((status: string) => ({
          title: status,
          value: status,
        })),
        value: PostStatus.Online,
      },
      {
        name: "type",
        title: "Type",
        type: "select",
        options: [
          { title: "Life", value: "Life" },
          { title: "Academic", value: "Academic" },
          { title: "Knowledge", value: "Knowledge" }
        ],
        value: "Knowledge",
        validation: {
          required: true,
        },
      },
      {
        name: "tag",
        title: "Tags",
        type: "text",
        placeholder: "Enter tags separated by commas (e.g., nextjs,react,tutorial)",
        tip: "Separate multiple tags with commas",
      },
      {
        name: "description",
        title: "Description",
        type: "textarea",
        placeholder: "Post Description",
      },
      {
        name: "cover_url",
        title: "Cover URL",
        type: "text",
        placeholder: "Post Cover Image URL",
      },
      {
        name: "author_name",
        title: "Author Name",
        type: "text",
        placeholder: "Author Name",
        value: "Eson",
      },
      {
        name: "author_avatar_url",
        title: "Author Avatar URL",
        type: "url",
        placeholder: "Author Avatar Image URL",
      },
      {
        name: "content",
        title: "Content",
        type: "markdown_editor",
        placeholder: "Post Content",
      },
    ],
    submit: {
      button: {
        title: "Submit",
      },
      handler: addPost,
    },
  };

  return <PostFormSlot {...form} />;
}
