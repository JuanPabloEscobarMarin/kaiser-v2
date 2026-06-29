import { useEffect, useRef, useState } from "react";

const EMOJI_LIST = [
  "📅", "✂️", "💈", "🧴", "🪒", "🧼", "💆", "🌟", "⭐", "✨",
  "💪", "🏆", "🎯", "🎉", "🎊", "👍", "❤️", "🔥", "💡", "🕐",
  "📍", "📞", "💬", "📱", "🏠", "🚗", "💰", "💳", "🎁", "🧹",
  "🌿", "🌸", "🌺", "🍃", "🌊", "☀️", "🌙", "🎶", "🎵", "🛒",
  "👤", "👥", "👩", "👨", "🙂", "😊", "😎", "🤝", "🌍", "⚡",
];

interface Props {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
}

export function EmojiPicker({ value, onChange, label = "Emoji" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <fieldset>
      <legend className="text-sm font-medium mb-1">{label}</legend>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="btn btn-outline btn-sm w-full justify-start gap-2 font-normal pr-8"
          aria-label="Seleccionar emoji"
        >
          <span className="text-xl leading-none">{value || "—"}</span>
          <span className="text-xs opacity-60">cambiar</span>
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="btn btn-ghost btn-xs btn-circle absolute right-1 top-1/2 -translate-y-1/2"
            aria-label="Quitar emoji"
            title="Quitar emoji"
          >
            ✕
          </button>
        ) : null}

        {open && (
          <div className="absolute z-50 mt-1 bg-base-100 border border-base-300 rounded-box shadow-lg p-2 w-64">
            <div className="grid grid-cols-10 gap-0.5">
              {EMOJI_LIST.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    onChange(em);
                    setOpen(false);
                  }}
                  className={`text-xl p-1 rounded hover:bg-base-200 transition-colors ${
                    value === em ? "bg-primary/20 ring-1 ring-primary" : ""
                  }`}
                  title={em}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="divider my-1 text-xs">o escribe</div>
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="Pega o escribe un emoji"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              maxLength={4}
            />
          </div>
        )}
      </div>
    </fieldset>
  );
}
