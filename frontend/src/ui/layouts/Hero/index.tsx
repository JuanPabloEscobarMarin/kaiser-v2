import type { ReactNode } from "react";
import Navbar from "../components/NavBar";

interface Props {
  children: ReactNode;
  background: string;
}

export function Hero({ children, background }: Readonly<Props>) {
  return (
    <div
      className="hero min-h-screen"
      style={{
        backgroundImage: `url(${background})`,
      }}
    >
      <div className="hero-overlay">
        <Navbar></Navbar>
      </div>
      <div className="hero-content text-neutral-content text-center">
        {children}
      </div>
    </div>
  );
}
