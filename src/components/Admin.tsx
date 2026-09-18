import { useEffect, useState, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import type { Lang } from "../config/business";
import { extended } from "../i18n/extended";
import {
  cms,
  cmsConfigured,
  isEditor,
  editorPosts,
  newPost,
  savePost,
  deletePost,
  uploadImage,
  type Post,
  type ContentBlock,
} from "../lib/cms";
import { Container } from "./UI";
import { ArticleContent } from "./ArticleContent";
export default function Admin({ lang }: { lang: Lang }) {
  const t = extended[lang],
    a = t.admin;
  const [access, setAccess] = useState<
      "loading" | "login" | "editor" | "denied"
    >(cmsConfigured ? "loading" : "login"),
    [posts, setPosts] = useState<Post[]>([]),
    [post, setPost] = useState<Post | null>(null),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [message, setMessage] = useState(""),
    [preview, setPreview] = useState(false),
    [dirty, setDirty] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    const client = cms();
    if (!client) return;
    let live = true;
    const check = async () => {
      try {
        const { data, error } = await client.auth.getUser();
        if (error || !data.user) {
          if (live) setAccess("login");
          return;
        }
        const allowed = await isEditor();
        if (live) setAccess(allowed ? "editor" : "denied");
        if (allowed) {
          const rows = await editorPosts();
          if (live) setPosts(rows);
        }
      } catch {
        if (live) {
          setAccess("denied");
          setMessage(t.error);
        }
      }
    };
    void check();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAccess("login");
        setPost(null);
        setPosts([]);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
        setTimeout(() => void check(), 0);
    });
    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, [t.error]);
  useEffect(() => {
    if (!dirty) return;
    const handle = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, [dirty]);
  const select = (next: Post | null) => {
    if (dirty && !window.confirm(a.unsaved)) return;
    setPost(next);
    setDirty(false);
    setPreview(false);
    setMessage("");
    setConfirmDelete(false);
  };
  const update = (next: Partial<Post>) => {
    setPost((p) => (p ? { ...p, ...next } : p));
    setDirty(true);
    setMessage("");
  };
  const save = async (status?: Post["status"]) => {
    if (!post || busy || uploading) return;
    setBusy(true);
    setMessage("");
    try {
      const value = {
        ...post,
        status: status || post.status,
        published_at:
          status === "published"
            ? post.published_at || new Date().toISOString()
            : post.published_at,
      };
      const saved = await savePost(value);
      setPost(saved);
      setPosts(await editorPosts());
      setDirty(false);
      setMessage(a.saved);
    } catch {
      setMessage(`${a.failed} ${a.required}`);
    } finally {
      setBusy(false);
    }
  };
  const upload = async (file: File | undefined, index?: number) => {
    if (!file || !post) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (index === undefined) update({ cover_image: url });
      else
        update({
          content: post.content.map((b, i) =>
            i === index ? { ...b, url } : b,
          ),
        });
    } catch {
      setMessage(a.uploadError);
    } finally {
      setUploading(false);
    }
  };
  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const data = new FormData(e.currentTarget);
    try {
      const { error } = await cms()!.auth.signInWithPassword({
        email: String(data.get("email")),
        password: String(data.get("password")),
      });
      if (error) throw error;
      setAccess("loading");
      if (await isEditor()) {
        setPosts(await editorPosts());
        setAccess("editor");
      } else setAccess("denied");
    } catch {
      setAccess("login");
      setMessage(a.loginError);
    } finally {
      setBusy(false);
    }
  };
  const field = (
    key:
      | "title"
      | "slug"
      | "excerpt"
      | "author"
      | "cover_image"
      | "cover_alt"
      | "seo_title"
      | "seo_description"
      | "og_image",
    label: string,
    multiline = false,
  ) =>
    post && (
      <div className="field">
        <label htmlFor={`post-${key}`}>{label}</label>
        {multiline ? (
          <textarea
            id={`post-${key}`}
            value={post[key]}
            onChange={(e) => update({ [key]: e.target.value })}
            rows={3}
          />
        ) : (
          <input
            id={`post-${key}`}
            value={post[key]}
            onChange={(e) => update({ [key]: e.target.value })}
            required={["title", "slug", "author", "seo_title"].includes(key)}
          />
        )}
      </div>
    );
  const changeBlock = (i: number, patch: Partial<ContentBlock>) =>
    post &&
    update({
      content: post.content.map((b, k) => (k === i ? { ...b, ...patch } : b)),
    });
  const move = (i: number, direction: number) => {
    if (!post) return;
    const content = [...post.content];
    [content[i], content[i + direction]] = [content[i + direction], content[i]];
    update({ content });
  };
  return (
    <section className="section admin-page">
      <Helmet>
        <title>{`${a.title} | PRIME`}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Container>
        <div className="admin-heading">
          <h1>{a.title}</h1>
          {access !== "login" && cmsConfigured && (
            <button
              className="btn secondary"
              onClick={async () => {
                if (dirty && !window.confirm(a.unsaved)) return;
                await cms()!.auth.signOut();
                setDirty(false);
              }}
            >
              {a.logout}
            </button>
          )}
        </div>
        {!cmsConfigured ? (
          <p className="warning">{a.notConfigured}</p>
        ) : access === "loading" ? (
          <p role="status">{t.loading}</p>
        ) : access === "login" ? (
          <form className="admin-login" onSubmit={login}>
            <div className="field">
              <label htmlFor="admin-email">{a.email}</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="admin-password">{a.password}</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
              />
            </div>
            <button className="btn primary" disabled={busy}>
              {busy ? t.loading : a.login}
            </button>
          </form>
        ) : access === "denied" ? (
          <p className="warning">{a.denied}</p>
        ) : (
          <>
            <div className="admin-toolbar">
              <button className="btn secondary" onClick={() => select(null)}>
                {a.posts}
              </button>
              <button
                className="btn primary"
                onClick={() => select(newPost(lang))}
              >
                {a.newPost}
              </button>
            </div>
            {!post ? (
              <div className="post-management">
                {posts.map((p) => (
                  <article key={p.id}>
                    <div>
                      <h2>{p.title}</h2>
                      <p>
                        {p.locale.toUpperCase()} ·{" "}
                        {p.status === "draft" ? a.draft : a.published}
                      </p>
                    </div>
                    <button className="btn secondary" onClick={() => select(p)}>
                      {a.edit}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="post-editor">
                <div className="admin-toolbar">
                  <button
                    className="btn secondary"
                    onClick={() => setPreview(!preview)}
                  >
                    {preview ? a.closePreview : a.preview}
                  </button>
                  <span>{post.status === "draft" ? a.draft : a.published}</span>
                </div>
                {preview ? (
                  <article>
                    <h1>{post.title}</h1>
                    {post.cover_image && (
                      <img
                        src={post.cover_image}
                        alt={post.cover_alt}
                        width={1200}
                        height={800}
                      />
                    )}
                    <ArticleContent blocks={post.content} />
                  </article>
                ) : (
                  <>
                    <div className="form-grid">
                      {field("title", a.titleField)}
                      {field("slug", a.slug)}
                      <div className="field">
                        <label htmlFor="post-locale">{a.locale}</label>
                        <select
                          id="post-locale"
                          value={post.locale}
                          onChange={(e) =>
                            update({ locale: e.target.value as Lang })
                          }
                        >
                          {["pl", "en", "ru"].map((l) => (
                            <option key={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor="post-translation">
                          {a.translation}
                        </label>
                        <select
                          id="post-translation"
                          value={post.translation_group}
                          onChange={(e) =>
                            update({ translation_group: e.target.value })
                          }
                        >
                          <option value={post.translation_group}>
                            {posts.find(
                              (p) =>
                                p.translation_group ===
                                  post.translation_group && p.id !== post.id,
                            )?.title || a.standalone}
                          </option>
                          {posts
                            .filter(
                              (p, i, list) =>
                                p.id !== post.id &&
                                list.findIndex(
                                  (x) =>
                                    x.translation_group === p.translation_group,
                                ) === i &&
                                p.translation_group !== post.translation_group,
                            )
                            .map((p) => (
                              <option key={p.id} value={p.translation_group}>
                                {p.title}
                              </option>
                            ))}
                        </select>
                      </div>
                      {field("author", a.author)}
                      <div className="field">
                        <label htmlFor="post-date">{a.date}</label>
                        <input
                          id="post-date"
                          type="datetime-local"
                          value={
                            post.published_at
                              ? new Date(
                                  new Date(post.published_at).getTime() -
                                    new Date(
                                      post.published_at,
                                    ).getTimezoneOffset() *
                                      60000,
                                )
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            update({
                              published_at: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : null,
                            })
                          }
                        />
                      </div>
                    </div>
                    {field("excerpt", a.excerpt, true)}
                    {field("cover_image", a.cover)}
                    {field("cover_alt", a.coverAlt)}
                    <label className="upload">
                      {uploading ? a.uploading : a.upload}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploading}
                        onChange={(e) => {
                          void upload(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <p className="note">{a.imageHint}</p>
                    <h2 className="editor-content-heading">{a.content}</h2>
                    <p className="note">{a.formatHint}</p>
                    {post.content.map((b, i) => (
                      <fieldset className="editor-block" key={b.id}>
                        <legend>
                          {i + 1}. {a.blockTypes[b.type]}
                        </legend>
                        <div className="field">
                          <label htmlFor={`block-${b.id}`}>{a.text}</label>
                          <textarea
                            id={`block-${b.id}`}
                            rows={b.type === "paragraph" ? 5 : 3}
                            value={b.text}
                            onChange={(e) =>
                              changeBlock(i, { text: e.target.value })
                            }
                          />
                        </div>
                        {(b.type === "image" || b.type === "cta") && (
                          <div className="field">
                            <label htmlFor={`url-${b.id}`}>{a.url}</label>
                            <input
                              id={`url-${b.id}`}
                              value={b.url}
                              onChange={(e) =>
                                changeBlock(i, { url: e.target.value })
                              }
                            />
                          </div>
                        )}
                        {b.type === "image" && (
                          <>
                            <div className="field">
                              <label htmlFor={`alt-${b.id}`}>{a.alt}</label>
                              <input
                                id={`alt-${b.id}`}
                                value={b.alt}
                                onChange={(e) =>
                                  changeBlock(i, { alt: e.target.value })
                                }
                              />
                            </div>
                            <label className="upload">
                              {a.upload}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={uploading}
                                onChange={(e) => {
                                  void upload(e.target.files?.[0], i);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </>
                        )}
                        <div className="admin-toolbar">
                          <button
                            className="text-button"
                            disabled={i === 0}
                            onClick={() => move(i, -1)}
                          >
                            {a.moveUp}
                          </button>
                          <button
                            className="text-button"
                            disabled={i === post.content.length - 1}
                            onClick={() => move(i, 1)}
                          >
                            {a.moveDown}
                          </button>
                          <button
                            className="text-button"
                            onClick={() =>
                              update({
                                content: post.content.filter((_, k) => k !== i),
                              })
                            }
                          >
                            {a.deleteBlock}
                          </button>
                        </div>
                      </fieldset>
                    ))}
                    <div className="admin-toolbar">
                      <span>{a.addBlock}:</span>
                      {(
                        Object.keys(a.blockTypes) as ContentBlock["type"][]
                      ).map((type) => (
                        <button
                          className="btn secondary"
                          key={type}
                          onClick={() =>
                            update({
                              content: [
                                ...post.content,
                                {
                                  id: crypto.randomUUID(),
                                  type,
                                  text: "",
                                  url: "",
                                  alt: "",
                                },
                              ],
                            })
                          }
                        >
                          {a.blockTypes[type]}
                        </button>
                      ))}
                    </div>
                    <div className="form-grid">
                      {field("seo_title", a.seoTitle)}
                      {field("seo_description", a.seoDescription, true)}
                    </div>
                    {field("og_image", a.ogImage)}
                  </>
                )}
                <div className="editor-save">
                  <button
                    className="btn primary"
                    disabled={busy || uploading}
                    onClick={() => void save()}
                  >
                    {busy ? t.loading : a.save}
                  </button>
                  <button
                    className="btn secondary"
                    disabled={busy || uploading}
                    onClick={() =>
                      void save(
                        post.status === "published" ? "draft" : "published",
                      )
                    }
                  >
                    {post.status === "published" ? a.unpublish : a.publish}
                  </button>
                  <button
                    className="text-button"
                    disabled={busy || !posts.some((p) => p.id === post.id)}
                    onClick={() => setConfirmDelete(true)}
                  >
                    {a.remove}
                  </button>
                </div>
                {confirmDelete && (
                  <div className="warning">
                    <p>{a.confirm}</p>
                    <div className="admin-toolbar">
                      <button
                        className="btn secondary"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await deletePost(post.id);
                            setPosts(await editorPosts());
                            setPost(null);
                            setDirty(false);
                            setConfirmDelete(false);
                            setMessage(a.saved);
                          } catch {
                            setMessage(a.failed);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {a.remove}
                      </button>
                      <button
                        className="text-button"
                        onClick={() => setConfirmDelete(false)}
                      >
                        {a.cancel}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        <p className="admin-message" role="status">
          {message}
        </p>
      </Container>
    </section>
  );
}
