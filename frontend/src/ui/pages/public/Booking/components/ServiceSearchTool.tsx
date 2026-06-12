import type { Dispatch, SetStateAction } from "react";

interface Props {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
}

export function ServiceSearchTool({ query, setQuery }: Readonly<Props>) {
  return (
    <label
      className="input input-bordered flex items-center gap-2 w-full transition-all duration-300 focus-within:scale-[1.02] focus-within:shadow-lg focus-within:shadow-primary/10 focus-within:border-primary"
      htmlFor="search"
    >
      <svg
        className={`h-4 w-4 transition-all duration-300 ${
          query ? "opacity-100 text-primary rotate-12 scale-110" : "opacity-60"
        }`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <g
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth="2.5"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </g>
      </svg>
      <input
        type="search"
        id="search"
        placeholder="Busca corte, barba, tinte..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="grow bg-transparent outline-none"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="btn btn-ghost btn-xs btn-circle animate-pop-in"
          aria-label="Limpiar búsqueda"
        >
          ✕
        </button>
      )}
    </label>
  );
}
