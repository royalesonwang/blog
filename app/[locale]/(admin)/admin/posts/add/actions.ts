"use server";

import { PostStatus, findPostBySlug, insertPost } from "@/models/post";
import { Post } from "@/types/post";
import { getIsoTimestr } from "@/lib/time";
import { getUuid } from "@/lib/hash";

export async function addPost(formData: FormData, passby?: any) {
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const locale = formData.get("locale") as string;
  const status = formData.get("status") as string;
  const description = formData.get("description") as string;
  const cover_url = formData.get("cover_url") as string;
  const author_name = formData.get("author_name") as string;
  const author_avatar_url = formData.get("author_avatar_url") as string;
  const content = formData.get("content") as string;

  if (
    !title ||
    !title.trim() ||
    !slug ||
    !slug.trim() ||
    !locale ||
    !locale.trim()
  ) {
    throw new Error("invalid form data");
  }

  const existPost = await findPostBySlug(slug, locale);
  if (existPost) {
    throw new Error("post with same slug already exists");
  }

  const post: Post = {
    uuid: getUuid(),
    created_at: getIsoTimestr(),
    status: status as PostStatus,
    title,
    slug,
    locale,
    description,
    cover_url,
    author_name,
    author_avatar_url,
    content,
  };

  try {
    await insertPost(post);

    return {
      status: "success" as const,
      message: "Post added",
      redirect_url: "/admin/posts",
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
} 