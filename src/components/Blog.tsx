import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { business, type Lang } from "../config/business";
import { extended } from "../i18n/extended";
import { publishedPosts, type Post } from "../lib/cms";
import { track } from "../lib/tracking";
import { Container } from "./UI";
import { ArticleContent } from "./ArticleContent";
export default function Blog({
  lang,
  slug,
  onAlternates,
}: {
  lang: Lang;
  slug?: string;
  onAlternates: (links: Partial<Record<Lang, string>>) => void;
}) {
  const t = extended[lang],
    b = t.blog;
  const [posts, setPosts] = useState<Post[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    publishedPosts()
      .then((data) => {
        if (live) {
          setPosts(data);
          setLoading(false);
          setError(false);
        }
      })
      .catch(() => {
        if (live) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [retry]);
  const post = slug
    ? posts.find((p) => p.locale === lang && p.slug === slug)
    : undefined;
  useEffect(() => {
    const links: Partial<Record<Lang, string>> = {};
    if (post)
      for (const p of posts.filter(
        (p) => p.translation_group === post.translation_group,
      ))
        links[p.locale] = `/${p.locale}/blog/${p.slug}`;
    onAlternates(links);
    if (post) track("view_blog_post", { id: post.id });
    return () => onAlternates({});
  }, [post, posts, onAlternates]);
  const title = post?.seo_title || b.title;
  const description = post?.seo_description || b.intro;
  const path = `/${lang}/blog${slug ? `/${slug}` : ""}`;
  const variants = post
    ? posts.filter((p) => p.translation_group === post.translation_group)
    : [];
  return (
    <section className="section blog-page">
      <Helmet>
        <title>{`${title} | ${business.name}`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={business.siteUrl + path} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={business.siteUrl + path} />
        <meta property="og:type" content={post ? "article" : "website"} />
        <meta
          property="og:image"
          content={
            post?.og_image || post?.cover_image || `${business.siteUrl}/og.jpg`
          }
        />
        <meta name="twitter:card" content="summary_large_image" />
        {slug && !post && <meta name="robots" content="noindex" />}
        {variants.map((p) => (
          <link
            key={p.id}
            rel="alternate"
            hrefLang={p.locale}
            href={`${business.siteUrl}/${p.locale}/blog/${p.slug}`}
          />
        ))}
        {!slug &&
          (["pl", "en", "ru"] as const).map((l) => (
            <link
              key={l}
              rel="alternate"
              hrefLang={l}
              href={`${business.siteUrl}/${l}/blog`}
            />
          ))}
        {post && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.excerpt,
              image: post.cover_image || undefined,
              datePublished: post.published_at,
              dateModified: post.updated_at,
              author: { "@type": "Person", name: post.author },
              publisher: { "@type": "Organization", name: business.name },
              mainEntityOfPage: business.siteUrl + path,
              inLanguage: lang,
            })}
          </script>
        )}
      </Helmet>
      <Container>
        <nav className="breadcrumbs" aria-label={t.home}>
          <Link to={`/${lang}`}>{t.home}</Link>
          <span>/</span>
          {slug ? (
            <Link to={`/${lang}/blog`}>{t.blogNav}</Link>
          ) : (
            <span>{t.blogNav}</span>
          )}
        </nav>
        {loading ? (
          <p role="status">{t.loading}</p>
        ) : error ? (
          <div>
            <h1>{b.title}</h1>
            <p role="alert">{t.error}</p>
            <button
              className="btn secondary"
              onClick={() => {
                setLoading(true);
                setRetry((x) => x + 1);
              }}
            >
              {t.retry}
            </button>
          </div>
        ) : post ? (
          <article className="blog-article">
            <p className="eyebrow">{t.blogNav}</p>
            <h1>{post.title}</h1>
            <p className="article-meta">
              {b.author}: {post.author} ·{" "}
              <time dateTime={post.published_at!}>
                {new Date(post.published_at!).toLocaleDateString(lang)}
              </time>
            </p>
            <p className="article-excerpt">{post.excerpt}</p>
            {post.cover_image && (
              <img
                className="article-cover"
                src={post.cover_image}
                alt={post.cover_alt}
                width={1200}
                height={800}
                fetchPriority="high"
              />
            )}
            <ArticleContent blocks={post.content} />
            <a className="btn primary" href={`/${lang}#calculator`}>
              {b.cta}
            </a>
          </article>
        ) : slug ? (
          <>
            <h1>{b.notFound}</h1>
            <Link className="text-button" to={`/${lang}/blog`}>
              {b.all}
            </Link>
          </>
        ) : (
          <>
            <div className="section-heading">
              <span className="eyebrow">PRIME / {t.blogNav}</span>
              <h1>{b.title}</h1>
              <p>{b.intro}</p>
            </div>
            {posts.some((p) => p.locale === lang) ? (
              <div className="blog-list">
                {posts
                  .filter((p) => p.locale === lang)
                  .map((p) => (
                    <article key={p.id}>
                      {p.cover_image && (
                        <img
                          src={p.cover_image}
                          alt={p.cover_alt}
                          width={600}
                          height={400}
                          loading="lazy"
                        />
                      )}
                      <div>
                        <h2>
                          <Link to={`/${lang}/blog/${p.slug}`}>{p.title}</Link>
                        </h2>
                        <p>{p.excerpt}</p>
                        <Link
                          className="text-button"
                          to={`/${lang}/blog/${p.slug}`}
                        >
                          {b.read}
                        </Link>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="blog-empty">
                <h2>{b.empty}</h2>
                <p>{b.emptyText}</p>
                <a className="btn primary" href={`/${lang}#calculator`}>
                  {b.cta}
                </a>
              </div>
            )}
          </>
        )}
      </Container>
    </section>
  );
}
