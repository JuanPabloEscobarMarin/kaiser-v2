import { createContext } from "react";

export interface NotifyMessage {
  label: string;
  type: "info" | "success" | "warning" | "error";
}

interface ContextResult {
  message: NotifyMessage;
  isVisible: boolean;
  isLeaving: boolean;
  notify: () => void;
  setMessage: (input: NotifyMessage) => void;
}

const contextDefault: ContextResult = {
  message: { label: "", type: "info" },
  isVisible: false,
  isLeaving: false,
  notify: () => {},
  setMessage: () => {},
};

export const NotifyContext = createContext<ContextResult>(contextDefault);
