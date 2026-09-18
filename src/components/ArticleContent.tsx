import { Fragment } from "react";
import type { ContentBlock } from "../lib/cms";
import { safeUrl } from "../lib/cms";
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
        if (part.startsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        return link && safeUrl(link[2]) ? (
          <a key={i} href={link[2]} rel="noopener noreferrer">
            {link[1]}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
export function ArticleContent({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="article-content">
      {blocks.map((b) => {
        switch (b.type) {
          case "h2":
            return <h2 key={b.id}>{b.text}</h2>;
          case "h3":
            return <h3 key={b.id}>{b.text}</h3>;
          case "list":
            return (
              <ul key={b.id}>
                {b.text
                  .split("\n")
                  .filter(Boolean)
                  .map((s, i) => (
                    <li key={i}>
                      <Inline text={s} />
                    </li>
                  ))}
              </ul>
            );
          case "image":
            return safeUrl(b.url) ? (
              <figure key={b.id}>
                <img
                  src={b.url}
                  alt={b.alt}
                  width={1200}
                  height={800}
                  loading="lazy"
                />
                {b.text && <figcaption>{b.text}</figcaption>}
              </figure>
            ) : null;
          case "cta":
            return safeUrl(b.url) ? (
              <a className="btn primary" key={b.id} href={b.url}>
                {b.text}
              </a>
            ) : null;
          default:
            return (
              <p key={b.id}>
                <Inline text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
