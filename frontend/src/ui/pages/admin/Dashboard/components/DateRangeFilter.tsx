import { useState } from "react";
import {
  fromYmd,
  presetRange,
  toYmd,
  type DateRange,
  type Preset,
} from "../utils";

const PRESET_LABELS: Record<Preset, string> = {
  TODAY: "Hoy",
  WEEK: "Semana",
  MONTH: "Mes",
  CUSTOM: "Personalizado",
};

interface Props {
  range: DateRange;
  preset: Preset;
  onChange: (preset: Preset, range: DateRange) => void;
}

export function DateRangeFilter({ range, preset, onChange }: Props) {
  const [from, setFrom] = useState(() => toYmd(range.from));
  const [to, setTo] = useState(() =>
    toYmd(new Date(range.to.getTime() - 86_400_000)),
  );

  // Sincronización prop→estado durante el render (patrón recomendado por
  // React en lugar de un efecto con setState síncrono).
  const [prevRange, setPrevRange] = useState(range);
  if (prevRange !== range) {
    setPrevRange(range);
    setFrom(toYmd(range.from));
    setTo(toYmd(new Date(range.to.getTime() - 86_400_000)));
  }

  const choosePreset = (p: Preset) => {
    if (p === "CUSTOM") {
      onChange(p, range);
      return;
    }
    onChange(p, presetRange(p));
  };

  const applyCustom = () => {
    if (!from || !to) return;
    const fromDate = fromYmd(from);
    const toDate = new Date(fromYmd(to).getTime() + 86_400_000);
    if (fromDate.getTime() > toDate.getTime()) return;
    onChange("CUSTOM", { from: fromDate, to: toDate });
  };

  return (
    <div className="space-y-3">
      <div role="tablist" className="tabs tabs-boxed w-fit">
        {(Object.keys(PRESET_LABELS) as Preset[]).map((p) => (
          <button
            key={p}
            role="tab"
            className={`tab ${preset === p ? "tab-active" : ""}`}
            onClick={() => choosePreset(p)}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      {preset === "CUSTOM" && (
        <div className="flex flex-wrap items-end gap-2">
          <fieldset>
            <legend className="text-xs font-medium opacity-70 mb-1">
              Desde
            </legend>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </fieldset>
          <fieldset>
            <legend className="text-xs font-medium opacity-70 mb-1">
              Hasta
            </legend>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </fieldset>
          <button className="btn btn-sm btn-primary" onClick={applyCustom}>
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
