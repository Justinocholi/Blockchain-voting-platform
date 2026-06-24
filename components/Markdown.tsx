"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    import("mermaid")
      .then((mod) => {
        if (cancelled || !ref.current) return;
        const mermaid = mod.default;
        mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
        const nodes = ref.current.querySelectorAll<HTMLElement>(".mermaid");
        if (nodes.length) {
          mermaid.run({ nodes }).catch(() => {
            /* leave the source visible if a diagram fails to render */
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [content]);

  return (
    <div className="markdown" ref={ref}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            if (className === "language-mermaid") {
              return <div className="mermaid">{String(children).replace(/\n$/, "")}</div>;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Keep internal doc links working within the app.
          a({ href, children, ...props }) {
            let to = href ?? "";
            if (to.endsWith(".md")) {
              to = "/docs/" + to.replace(/^.*\//, "").replace(/\.md$/, "");
            }
            return (
              <a href={to} {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
