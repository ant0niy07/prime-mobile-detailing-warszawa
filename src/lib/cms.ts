import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Lang } from "../config/business";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let instance: SupabaseClient | null = null;
export const cmsConfigured =
  !!url && !!key && import.meta.env.VITE_CMS_ENABLED === "true";
export function cms() {
  if (!cmsConfigured) return null;
  if (!instance)
    instance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage:
          typeof window === "undefined" ? undefined : window.sessionStorage,
      },
    });
  return instance;
}
export const safeUrl = (value: string) =>
  /^https:\/\/[^\s]+$/i.test(value) || /^\/(?!\/)[^\s\\]*$/.test(value);
const imageUrl = z
  .string()
  .max(2000)
  .refine((v) => !v || safeUrl(v));
export const blockSchema = z.object({
  id: z.string(),
  type: z.enum(["paragraph", "h2", "h3", "list", "image", "cta"]),
  text: z.string().max(20000),
  url: imageUrl,
  alt: z.string().max(500),
});
export type ContentBlock = z.infer<typeof blockSchema>;
export const postSchema = z
  .object({
    id: z.string().uuid(),
    translation_group: z.string().uuid(),
    locale: z.enum(["pl", "en", "ru"]),
    title: z.string().trim().min(3).max(180),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(150),
    excerpt: z.string().trim().min(10).max(500),
    content: z.array(blockSchema).min(1).max(150),
    cover_image: imageUrl,
    cover_alt: z.string().max(500),
    author: z.string().trim().min(2).max(150),
    status: z.enum(["draft", "published"]),
    published_at: z.string().datetime({ offset: true }).nullable(),
    updated_at: z.string(),
    seo_title: z.string().trim().min(3).max(180),
    seo_description: z.string().trim().min(10).max(320),
    og_image: imageUrl,
  })
  .refine((p) => p.status === "draft" || !!p.published_at)
  .refine((p) => !p.cover_image || !!p.cover_alt.trim())
  .refine((p) =>
    p.content.every((b) =>
      b.type === "image"
        ? !!b.url && !!b.alt.trim()
        : b.type === "cta"
          ? !!b.url && !!b.text.trim()
          : !!b.text.trim(),
    ),
  );
export type Post = z.infer<typeof postSchema>;
export const newPost = (locale: Lang): Post => ({
  id: crypto.randomUUID(),
  translation_group: crypto.randomUUID(),
  locale,
  title: "",
  slug: "",
  excerpt: "",
  content: [
    { id: crypto.randomUUID(), type: "paragraph", text: "", url: "", alt: "" },
  ],
  cover_image: "",
  cover_alt: "",
  author: "Prime Mob Detail",
  status: "draft",
  published_at: null,
  updated_at: new Date().toISOString(),
  seo_title: "",
  seo_description: "",
  og_image: "",
});
export async function publishedPosts(lang?: Lang) {
  const client = cms();
  if (!client) return [];
  let q = client
    .from("posts")
    .select("*")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (lang) q = q.eq("locale", lang);
  const { data, error } = await q;
  if (error?.code === "PGRST205") return [];
  if (error) throw error;
  return (data || []).map((p) => postSchema.parse(p));
}
export async function isEditor() {
  const client = cms();
  if (!client) return false;
  const { data, error } = await client.rpc("is_prime_editor");
  if (error) throw error;
  return data === true;
}
export async function editorPosts() {
  const { data, error } = await cms()!
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as Post[];
}
export async function savePost(post: Post) {
  const clean = postSchema.parse(post);
  const { data, error } = await cms()!
    .from("posts")
    .upsert({ ...clean, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return postSchema.parse(data);
}
export async function deletePost(id: string) {
  const { data, error } = await cms()!
    .from("posts")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || !data?.length) throw error || new Error("Not deleted");
}
export async function uploadImage(file: File) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  )
    throw new Error("Invalid image");
  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[file.type];
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await cms()!
    .storage.from("blog-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return cms()!.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
}
