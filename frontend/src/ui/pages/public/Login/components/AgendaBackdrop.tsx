import { BaseIcon } from "@/ui/components/base/BaseIcon";

const SLOTS = [
  { time: "09:00", position: "left-[6%] top-[16%]", delay: "0s" },
  { time: "10:30", position: "left-[12%] top-[55%] hidden md:block", delay: "2.4s" },
  { time: "11:15", position: "left-[5%] bottom-[10%] hidden sm:block", delay: "4.8s" },
  { time: "14:00", position: "right-[6%] top-[20%]", delay: "1.2s" },
  { time: "16:30", position: "right-[11%] top-[58%] hidden md:block", delay: "3.6s" },
  { time: "17:45", position: "right-[5%] bottom-[13%] hidden sm:block", delay: "6s" },
];

const CAL_CELLS = 28;
const CAL_TODAY = 16;

interface AgendaBackdropProps {
  /** Contador de interacciones con el formulario: agenda slots y gira el reloj. */
  interactions: number;
}

export function AgendaBackdrop({ interactions }: AgendaBackdropProps) {
  const booked = interactions % (SLOTS.length + 1);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Capa base: blobs de color */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-secondary/30 blur-3xl animate-blob-delayed" />
      </div>

      {/* Reloj abstracto: rotación lenta continua + giro extra al interactuar */}
      <div className="absolute left-[8%] top-[8%] h-24 w-24 md:h-32 md:w-32 opacity-25">
        <div className="absolute inset-0 rounded-full border-2 border-base-content/40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-full w-0.5 -translate-x-1/2 -translate-y-1/2"
            style={{ transform: `rotate(${i * 45}deg)` }}
          >
            <div className="mx-auto h-2 w-0.5 bg-base-content/40" />
          </div>
        ))}
        <div
          className="absolute inset-0 transition-transform duration-1000 ease-in-out"
          style={{ transform: `rotate(${interactions * 30}deg)` }}
        >
          <div className="absolute inset-0 animate-clock-spin">
            <div className="absolute left-1/2 top-1/2 h-[38%] w-0.5 -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-primary" />
          </div>
        </div>
        <div
          className="absolute inset-0 transition-transform duration-1000 ease-in-out"
          style={{ transform: `rotate(${45 + interactions * 12}deg)` }}
        >
          <div className="absolute left-1/2 top-1/2 h-[26%] w-0.5 -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-base-content/60" />
        </div>
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
      </div>

      {/* Silueta de calendario con onda de celdas; el "hoy" reacciona al focus */}
      <div className="absolute right-[6%] bottom-[6%] w-40 md:w-48 rotate-6 opacity-25">
        <div className="rounded-2xl border-2 border-base-content/40 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
            <div className="h-1.5 w-1/2 rounded bg-base-content/40" />
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: CAL_CELLS }).map((_, i) =>
              i === CAL_TODAY ? (
                <div
                  key={i}
                  className={`aspect-square rounded bg-primary transition-transform duration-700 ease-in-out ${
                    interactions > 0 ? "scale-125" : ""
                  }`}
                />
              ) : (
                <div
                  key={i}
                  className="aspect-square rounded bg-base-content/30 animate-cal-pulse"
                  style={{
                    animationDelay: `${(i % 7) * 0.35 + Math.floor(i / 7) * 0.8}s`,
                  }}
                />
              ),
            )}
          </div>
        </div>
      </div>

      {/* Slots de citas flotantes que se "agendan" al interactuar */}
      {SLOTS.map((slot, i) => {
        const isBooked = i < booked;
        return (
          <div
            key={slot.time}
            className={`absolute ${slot.position} animate-slot-float`}
            style={{ animationDelay: slot.delay }}
          >
            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all duration-700 ease-in-out ${
                isBooked
                  ? "border-primary/60 bg-primary text-primary-content scale-105"
                  : "border-base-content/15 bg-base-100/60 text-base-content/50 backdrop-blur-sm"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isBooked
                    ? "bg-primary-content"
                    : "bg-base-content/40 animate-slot-blink"
                }`}
                style={{ animationDelay: slot.delay }}
              />
              {slot.time}
              {isBooked && (
                <BaseIcon icon="check" size={11} viewBox="0 0 24 24" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
