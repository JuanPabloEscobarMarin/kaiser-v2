import { useCallback, useMemo, useRef, useState } from "react";
import { Outlet } from "react-router";
import { NotifyContext, type NotifyMessage } from "./NotifyContext";

const VISIBLE_MS = 5000;
const LEAVE_MS = 250;

export const NotifyProvider = () => {
  const [message, setMessage] = useState<NotifyMessage>({
    label: "",
    type: "info",
  });
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isLeaving, setIsLeaving] = useState<boolean>(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const notify = useCallback(() => {
    // Un aviso nuevo reemplaza al visible y reinicia su tiempo de vida;
    // antes se descartaba en silencio si llegaba dentro de los 5 s.
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setIsVisible(true);
    setIsLeaving(false);

    // Fase de salida: animar antes de desmontar el toast
    timers.current.push(
      setTimeout(() => setIsLeaving(true), VISIBLE_MS - LEAVE_MS),
      setTimeout(() => {
        setIsVisible(false);
        setIsLeaving(false);
      }, VISIBLE_MS),
    );
  }, []);

  const value = useMemo(
    () => ({
      message,
      setMessage,
      isVisible,
      isLeaving,
      notify,
    }),
    [message, setMessage, isVisible, isLeaving, notify],
  );

  return (
    <NotifyContext.Provider value={value}>
      <Outlet />
    </NotifyContext.Provider>
  );
};
