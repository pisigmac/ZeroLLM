import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { ModelStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ModelStatus;
  verified?: boolean;
}

export default function StatusBadge({ status, verified }: StatusBadgeProps) {
  if (status === "online") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        {verified && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
        <span>Online</span>
      </span>
    );
  }

  if (status === "offline") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <AlertCircle className="h-3 w-3 text-rose-500" />
        <span>Offline</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <HelpCircle className="h-3 w-3 text-amber-500" />
      <span>Unknown</span>
    </span>
  );
}
