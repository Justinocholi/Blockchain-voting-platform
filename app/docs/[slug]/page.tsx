import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/Markdown";
import { listDocs, readDoc } from "@/lib/docs";

export const dynamic = "force-static";

export function generateStaticParams() {
  return listDocs().map((d) => ({ slug: d.slug }));
}

export default function DocPage({ params }: { params: { slug: string } }) {
  const content = readDoc(params.slug);
  if (content === null) notFound();

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <Link className="btn ghost" href="/docs">
          ← All documents
        </Link>
      </div>
      <article className="card">
        <Markdown content={content} />
      </article>
    </>
  );
}
