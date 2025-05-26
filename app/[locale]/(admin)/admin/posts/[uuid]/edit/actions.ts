"use server";

import {
  PostStatus,
  findPostBySlug,
  updatePost,
} from "@/models/post";
import { Post } from "@/types/post";
import { getIsoTimestr } from "@/lib/time";
import { sendPostNotifications } from "@/services/notification";

export async function updatePostAction(formData: FormData, passby: any) {
  const { user, post } = passby;
  if (!user || !post || !post.uuid) {
    throw new Error("invalid params");
  }

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const locale = formData.get("locale") as string;
  const status = formData.get("status") as string;
  const description = formData.get("description") as string;
  const cover_url = formData.get("cover_url") as string;
  const author_name = formData.get("author_name") as string;
  const author_avatar_url = formData.get("author_avatar_url") as string;
  const content = formData.get("content") as string;
  const type = formData.get("type") as string;
  const tag = formData.get("tag") as string;

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
  if (existPost && existPost.uuid !== post.uuid) {
    throw new Error("post with same slug already exists");
  }

  const capitalizedType = type ? type.charAt(0).toUpperCase() + type.slice(1) : type;
  
  const updatedPost: Partial<Post> = {
    updated_at: getIsoTimestr(),
    status: status as PostStatus,
    title,
    slug,
    locale,
    description,
    cover_url,
    author_name,
    author_avatar_url,
    content,
    type: capitalizedType, // 使用首字母大写的类型
    tag,
  };

  try {
    await updatePost(post.uuid, updatedPost);
    
    // 只有文章处于在线状态时才发送通知
    if (status === PostStatus.Online) {
      // 将更新后的完整文章信息传递给通知服务
      const updatedFullPost: Post = {
        ...post,
        ...updatedPost
      };
      
      try {
        // 判断是否是从非在线状态变为在线状态（首次发布）
        const isFirstPublish = post.status !== PostStatus.Online;
        
        console.log(`准备发送文章 "${title}" (${type}) 的${isFirstPublish ? '首次发布' : '更新'}通知...`);
        
        // 根据是否为首次发布选择通知类型
        const notificationResult = await sendPostNotifications(updatedFullPost, !isFirstPublish);
        console.log(`文章${isFirstPublish ? '首次发布' : '更新'}通知结果:`, notificationResult);
      } catch (notifyError) {
        // 通知发送失败不应阻止文章的正常更新
        console.error('发送文章通知失败:', notifyError);
      }
    }

    return {
      status: "success" as const,
      message: "Post updated",
      redirect_url: "/admin/posts",
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
} 