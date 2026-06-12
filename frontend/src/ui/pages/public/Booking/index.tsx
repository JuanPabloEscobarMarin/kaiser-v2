import { useEffect, useMemo, useState } from "react";
import { servicesApi } from "@/core/api";
import type { Service } from "@/core/types";
import { ServiceCard } from "@/ui/components/ServiceCard";
import { Reveal } from "@/ui/components/Reveal";
import { ServiceSearchTool } from "./components/ServiceSearchTool";
import Navbar from "@/ui/layouts/components/NavBar";

const useDebounced = <T,>(value: T, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export function BookingPage() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Service[] | null>(null);
  const [loading, setLoading] = useState(true);
  // El skeleton se desvanece 250 ms antes de desmontarse (crossfade)
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setShowSkeleton(false), 250);
    return () => clearTimeout(t);
  }, [loading]);

  const debouncedQuery = useDebounced(query, 300);

  useEffect(() => {
    servicesApi
      .list()
      .then(setAllServices)
      .catch(() => setAllServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    servicesApi
      .search(q)
      .then((res) => {
        setSearchResults(
          res.results.map((r) => ({
            id: r.id,
            name: r.label,
            price: r.meta.price,
            duration: r.meta.duration,
            discount: r.meta.discount,
            urlImage: r.meta.urlImage,
            description: r.meta.description ?? "",
            state: true,
          })),
        );
      })
      .catch(() => setSearchResults([]));
  }, [debouncedQuery]);

  const services = useMemo(
    () => (searchResults ?? allServices).filter((s) => s.state),
    [allServices, searchResults],
  );

  const isSearching = query.trim().length >= 2;

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 border-b border-base-300">
        <div className="container mx-auto px-4 py-10 md:py-14 max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Reserva tu cita
          </h1>
          <p className="text-base-content/70 mt-2 max-w-xl">
            Elige el servicio, el profesional y la hora que prefieras. Sin
            cuentas, sin esperas.
          </p>

          <div className="mt-6 max-w-md">
            <ServiceSearchTool query={query} setQuery={setQuery} />
          </div>
        </div>
      </section>

      {/* Lista */}
      <section className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {isSearching
              ? `Resultados${services.length ? ` (${services.length})` : ""}`
              : "Nuestros servicios"}
          </h2>
        </div>

        {showSkeleton ? (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-250 ${
              loading ? "opacity-100" : "opacity-0"
            }`}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="card bg-base-100 shadow-md overflow-hidden"
              >
                <div className="aspect-video bg-base-300 animate-pulse" />
                <div className="card-body p-5 space-y-3">
                  <div className="h-4 w-3/4 bg-base-300 rounded animate-pulse" />
                  <div className="h-3 w-full bg-base-300 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-base-300 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="card bg-base-100 shadow animate-pop-in">
            <div className="card-body items-center text-center py-10">
              <span className="text-4xl animate-wave">💈</span>
              <p className="text-base-content/70">
                {isSearching
                  ? `No se encontraron servicios para "${query}"`
                  : "No hay servicios disponibles ahora mismo"}
              </p>
              {isSearching && (
                <button
                  onClick={() => setQuery("")}
                  className="btn btn-primary btn-sm mt-2"
                >
                  Ver todos los servicios
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            key={isSearching ? debouncedQuery : "all"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 group/grid"
          >
            {services.map((s, i) => (
              <Reveal key={s.id} index={i} spotlight className="h-full">
                <ServiceCard service={s} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
