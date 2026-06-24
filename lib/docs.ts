import fs from "fs";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "docs");

export type DocMeta = { slug: string; title: string };

export function listDocs(): DocMeta[] {
  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();
  return files.map((f) => {
    const slug = f.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(DOCS_DIR, f), "utf8");
    const heading = raw.split("\n").find((l) => l.startsWith("# "));
    const title = heading ? heading.replace(/^#\s*/, "") : slug;
    return { slug, title };
  });
}

export function readDoc(slug: string): string | null {
  const file = path.join(DOCS_DIR, slug + ".md");
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}
