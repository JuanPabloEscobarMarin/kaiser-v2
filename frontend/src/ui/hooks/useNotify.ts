import { useContext } from "react";
import { NotifyContext } from "../contexts/notify/NotifyContext";

export const useNotify = () => {
  const context = useContext(NotifyContext);
  return context;
};
