import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  safeUrl,
  postSchema,
  newPost,
  cmsConfigured,
  publishedPosts,
} from "../lib/cms";
import { ArticleContent } from "../components/ArticleContent";
import { fleetSchema } from "../lib/fleet";
describe("CMS content safety", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "//evil.example",
    "/\\evil.example",
  ])("rejects unsafe URL %s", (url) => expect(safeUrl(url)).toBe(false));
  it("renders text without executing HTML and permits safe emphasis/links", () => {
    render(
      <ArticleContent
        blocks={[
          {
            id: "1",
            type: "paragraph",
            text: "<script>bad()</script> **Good** [Link](javascript:bad)",
            url: "",
            alt: "",
          },
        ]}
      />,
    );
    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByText("Good").tagName).toBe("STRONG");
    expect(screen.queryByRole("link")).toBeNull();
  });
  it("requires publishable content, alt text and a date", () => {
    const p = {
      ...newPost("pl"),
      title: "An article",
      slug: "article",
      excerpt: "A useful article excerpt",
      seo_title: "An article title",
      seo_description: "A useful SEO description",
      content: [
        {
          id: "1",
          type: "paragraph" as const,
          text: "Body text",
          url: "",
          alt: "",
        },
      ],
    };
    expect(postSchema.safeParse(p).success).toBe(true);
    expect(postSchema.safeParse({ ...p, status: "published" }).success).toBe(
      false,
    );
    expect(
      postSchema.safeParse({
        ...p,
        cover_image: "https://example.test/photo.webp",
      }).success,
    ).toBe(false);
    expect(
      postSchema.safeParse({
        ...p,
        status: "published",
        published_at: new Date().toISOString(),
      }).success,
    ).toBe(true);
  });
  it("returns an honest empty list when CMS is disabled", async () => {
    if (!cmsConfigured) expect(await publishedPosts("pl")).toEqual([]);
  });
});
describe("fleet validation", () => {
  const valid = {
    company: "Company",
    taxId: "",
    contact: "Anna",
    phone: "+48600123456",
    email: "anna@example.test",
    count: "3",
    types: "Sedans",
    location: "Warsaw",
    frequency: "monthly",
    scope: "Interior cleaning",
    power: "yes",
    message: "",
    consent: true,
    website: "",
  };
  it("validates the independent business enquiry", () =>
    expect(fleetSchema.safeParse(valid).success).toBe(true));
  it.each([
    { email: "invalid" },
    { count: 0 },
    { phone: "abc" },
    { website: "spam" },
    { consent: false },
    { taxId: "123" },
  ])("rejects invalid fleet data %j", (data) =>
    expect(fleetSchema.safeParse({ ...valid, ...data }).success).toBe(false),
  );
});
