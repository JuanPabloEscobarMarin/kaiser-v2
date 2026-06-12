import {
  BUSINESS_CLOSE,
  BUSINESS_OPEN,
  HOUR_HEIGHT,
} from "./utils";

export function HourLabels() {
  const hours: number[] = [];
  for (let h = BUSINESS_OPEN; h <= BUSINESS_CLOSE; h++) hours.push(h);

  return (
    <div className="relative w-14 shrink-0 border-r border-base-300">
      {hours.map((h, i) => (
        <div
          key={h}
          className="absolute left-0 right-0 text-[11px] text-base-content/60 -translate-y-1/2 pr-1 text-right"
          style={{ top: i * HOUR_HEIGHT }}
        >
          {String(h).padStart(2, "0")}:00
        </div>
      ))}
    </div>
  );
}

export function HourGridLines() {
  const lines: number[] = [];
  for (let h = 0; h < BUSINESS_CLOSE - BUSINESS_OPEN; h++) {
    lines.push(h);
  }
  return (
    <>
      {lines.map((h) => (
        <div
          key={h}
          className="absolute left-0 right-0 border-t border-base-300/60"
          style={{ top: h * HOUR_HEIGHT }}
        />
      ))}
    </>
  );
}
