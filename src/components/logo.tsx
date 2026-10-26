import Link from "next/link";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-float">
        <Flame className="h-5 w-5" strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight text-slate-900">
          Gas<span className="text-brand-600">Checker</span>
        </span>
      )}
    </Link>
  );
}
