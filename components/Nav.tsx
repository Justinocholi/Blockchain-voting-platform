"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/vote", label: "Vote" },
  { href: "/bulletin", label: "Bulletin Board" },
  { href: "/verify", label: "Verify Receipt" },
  { href: "/docs", label: "Docs" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="main">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : ""}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
