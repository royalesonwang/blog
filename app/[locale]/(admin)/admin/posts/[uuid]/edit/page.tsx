import {
  PostStatus,
  findPostByUuid,
} from "@/models/post";
import { localeNames, locales } from "@/i18n/locale";

import Empty from "@/components/blocks/empty";
import PostFormSlot from "@/components/dashboard/slots/post-form";
import { Form as FormSlotType } from "@/types/slots/form";
import { getUserInfo } from "@/services/user";
import { updatePostAction } from "./actions";
 

export default async function ({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const user = await getUserInfo();
  if (!user || !user.uuid) {
    return <Empty message="no auth" />;
  }

  const post = await findPostByUuid(uuid);
  if (!post) {
    return <Empty message="post not found" />;
  }

  const form: FormSlotType = {
    title: "Edit Post",
    crumb: {
      items: [
        {
          title: "Posts",
          url: "/admin/posts",
        },
        {
          title: "Edit Post",
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
        value: PostStatus.Created,
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
    data: post,
    passby: {
      user,
      post,
    },
    submit: {
      button: {
        title: "Submit",
      },
      handler: updatePostAction,
    },
  };

  return <PostFormSlot {...form} />;
}
