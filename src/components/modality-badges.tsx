import { Modality } from "@/lib/types";

interface ModalityBadgesProps {
  modalities: Modality[];
  maxToShow?: number;
}

const config: Record<Modality, { label: string; className: string }> = {
  text: {
    label: "Text",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  code: {
    label: "Code",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
  reasoning: {
    label: "Reasoning",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  image: {
    label: "Image",
    className: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  },
  video: {
    label: "Video",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  audio: {
    label: "Audio",
    className: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  },
  embedding: {
    label: "Embedding",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  pdf: {
    label: "PDF",
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  rerank: {
    label: "Rerank",
    className: "bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20",
  },
};

export default function ModalityBadges({ modalities, maxToShow = 4 }: ModalityBadgesProps) {
  const visible = modalities.slice(0, maxToShow);
  const extra = modalities.length - maxToShow;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((m) => {
        const item = config[m] || { label: m, className: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20" };
        return (
          <span
            key={m}
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${item.className}`}
          >
            {item.label}
          </span>
        );
      })}
      {extra > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
          +{extra}
        </span>
      )}
    </div>
  );
}
