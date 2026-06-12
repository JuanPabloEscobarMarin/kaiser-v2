import { BaseIcon } from "@/ui/components/base/BaseIcon";

export type ClockMode = "idle" | "user" | "pass";

interface InteractiveClockProps {
  /** Caracteres escritos en el campo usuario: cada uno avanza un minuto. */
  userLen: number;
  /** Caracteres escritos en la contraseña: la manecilla de horas "busca" la cita. */
  passLen: number;
  mode: ClockMode;
  /** Algún input tiene focus: el reloj pulsa con una escala sutil. */
  focused: boolean;
  /** Iniciando sesión: las manecillas giran en time-lapse. */
  timelapse: boolean;
}

const BASE_HOUR_ANGLE = 270; // 9:00, hora de apertura

export function InteractiveClock({
  userLen,
  passLen,
  mode,
  focused,
  timelapse,
}: InteractiveClockProps) {
  const isPass = mode === "pass";

  const minuteAngle = userLen * 6;
  const hourAngle =
    BASE_HOUR_ANGLE + (isPass ? passLen * 30 : (userLen * 6) / 12);

  // Slots que se van "agendando": uno por cada 2 caracteres del usuario.
  const litCount = Math.min(Math.ceil(userLen / 2), 12);
  // En modo contraseña la manecilla persigue una única cita confirmada.
  const targetIdx = (9 + passLen) % 12;

  const totalMinutes =
    (9 * 60 + (isPass ? passLen * 60 : userLen)) % (24 * 60);
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");

  const faceSize =
    "h-44 w-44 md:h-60 md:w-60 lg:h-80 lg:w-80 xl:h-96 xl:w-96";

  const caption =
    mode === "pass"
      ? "Verificando un horario seguro"
      : mode === "user"
        ? "Recorriendo tu día"
        : "Agenda en tiempo real";

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className={`relative ${faceSize} rounded-full border backdrop-blur-md shadow-2xl transition-all duration-500 ease-in-out ${
          isPass
            ? "border-secondary/40 bg-base-100/30 shadow-[0_0_70px_-15px] shadow-secondary/40"
            : "border-base-content/10 bg-base-100/30"
        } ${focused ? "scale-[1.04] shadow-[0_0_70px_-15px] shadow-primary/40" : ""}`}
      >
        {/* Marcas de hora */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`mark-${i}`}
            className="absolute inset-2"
            style={{ transform: `rotate(${i * 30}deg)` }}
          >
            <div
              className={`absolute left-1/2 top-0 -translate-x-1/2 w-0.5 rounded-full ${
                i % 3 === 0
                  ? "h-3.5 bg-base-content/50"
                  : "h-2 bg-base-content/25"
              }`}
            />
          </div>
        ))}

        {/* Slots de cita alrededor del dial */}
        {Array.from({ length: 12 }).map((_, i) => {
          const lit = isPass ? i === targetIdx : i < litCount;
          return (
            <div
              key={`slot-${i}`}
              className="absolute inset-0"
              style={{ transform: `rotate(${i * 30}deg)` }}
            >
              <span
                className={`absolute left-1/2 top-[11%] -translate-x-1/2 rounded-full transition-all duration-500 ease-in-out ${
                  lit
                    ? isPass
                      ? "h-3 w-3 bg-secondary shadow-[0_0_12px] shadow-secondary"
                      : "h-3 w-3 bg-primary shadow-[0_0_12px] shadow-primary"
                    : "h-2 w-2 bg-base-content/15"
                }`}
              />
            </div>
          );
        })}

        {/* Manecilla de horas */}
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: `rotate(${hourAngle}deg)` }}
        >
          <div className={timelapse ? "absolute inset-0 animate-timelapse" : "absolute inset-0"}>
            <div
              className={`absolute left-1/2 top-1/2 h-[24%] w-1 -translate-x-1/2 -translate-y-full origin-bottom rounded-full transition-colors duration-500 ${
                isPass ? "bg-secondary" : "bg-base-content/70"
              }`}
            />
          </div>
        </div>

        {/* Manecilla de minutos: avanza frame a frame al escribir */}
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${minuteAngle}deg)` }}
        >
          <div className={timelapse ? "absolute inset-0 animate-timelapse" : "absolute inset-0"}>
            <div
              className={`absolute left-1/2 top-1/2 h-[36%] w-0.5 -translate-x-1/2 -translate-y-full origin-bottom rounded-full transition-colors duration-500 ${
                isPass ? "bg-secondary/80" : "bg-primary"
              }`}
            />
          </div>
        </div>

        {/* Centro */}
        <div
          className={`absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition-colors duration-500 ${
            isPass
              ? "border-secondary/40 bg-secondary/15 text-secondary"
              : "border-base-content/10 bg-base-100/60 text-primary"
          }`}
        >
          <BaseIcon
            icon={isPass ? "lock" : "diamond"}
            size={16}
            viewBox="0 0 24 24"
          />
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center gap-1">
        <span
          className={`font-mono text-2xl font-semibold tabular-nums transition-colors duration-500 ${
            isPass ? "text-secondary" : "text-base-content"
          }`}
        >
          {hh}:{mm}
        </span>
        <span className="text-sm text-base-content/50">{caption}</span>
      </div>
    </div>
  );
}
