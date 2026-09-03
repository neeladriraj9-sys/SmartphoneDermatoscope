import { Check } from "lucide-react";

export const ProgressSteps = ({ current, total = 3, labels }: { current: number; total?: number; labels?: string[] }) => (
  <div className="flex items-center gap-2" aria-label={`Step ${current} of ${total}`}>
    {Array.from({ length: total }).map((_, i) => {
      const step = i + 1;
      const done = step < current;
      const active = step === current;
      return (
        <div key={step} className="flex items-center gap-2 flex-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
              done ? "bg-primary text-primary-foreground" :
              active ? "bg-primary-light text-primary-dark border-2 border-primary" :
              "bg-secondary text-muted-foreground"
            }`}
          >
            {done ? <Check size={14} aria-hidden /> : step}
          </div>
          {labels?.[i] && (
            <span className={`text-xs ${active ? "text-foreground font-semibold" : "text-muted-foreground"} hidden sm:inline`}>
              {labels[i]}
            </span>
          )}
          {step < total && <div className={`h-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`} />}
        </div>
      );
    })}
  </div>
);
