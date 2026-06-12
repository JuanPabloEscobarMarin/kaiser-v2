import { useEffect, useState } from "react";
import { Link } from "react-router";
import heroDefault from "@/assets/hero-barbershop.jpg";
import {
  employeesApi,
  resourcesApi,
  servicesApi,
  settingsApi,
} from "@/core/api";
import type { BusinessSettings, Employee, Service } from "@/core/types";
import { HOME_CONTENT_DEFAULTS } from "@/core/branding/home-content";
import Navbar from "@/ui/layouts/components/NavBar";
import { ServiceCard } from "@/ui/components/ServiceCard";
import { Reveal } from "@/ui/components/Reveal";

const initials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [business, setBusiness] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    servicesApi
      .list()
      .then((arr) => setServices(arr.filter((s) => s.state).slice(0, 3)))
      .catch(() => setServices([]));
    employeesApi
      .list()
      .then((arr) => setEmployees(arr.filter((e) => e.state)))
      .catch(() => setEmployees([]));
    settingsApi
      .get()
      .then(setBusiness)
      .catch(() => setBusiness(null));
  }, []);

  const c = business?.homeContent ?? HOME_CONTENT_DEFAULTS;

  const formatHours = (open: string, close: string, closed: boolean) =>
    closed ? "Cerrado" : `${open} – ${close}`;

  const hours = business
    ? [
        {
          days: "Lunes – Viernes",
          time: formatHours(
            business.openTimeWeekday,
            business.closeTimeWeekday,
            business.closedWeekday,
          ),
        },
        {
          days: "Sábados",
          time: formatHours(
            business.openTimeSaturday,
            business.closeTimeSaturday,
            business.closedSaturday,
          ),
        },
        {
          days: "Domingos",
          time: formatHours(
            business.openTimeSunday,
            business.closeTimeSunday,
            business.closedSunday,
          ),
        },
      ]
    : [];

  const heroImage =
    (business?.heroImageSlug
      ? resourcesApi.imageUrl(business.heroImageSlug)
      : null) ?? heroDefault;

  const logoUrl = business?.logoSlug
    ? resourcesApi.imageUrl(business.logoSlug)
    : null;

  return (
    <div className="bg-base-200">
      <Navbar />

      {/* HERO */}
      <section
        className="hero min-h-[70vh] relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="hero-content text-neutral-content text-center max-w-2xl">
          <div>
            {logoUrl && (
              <img
                src={logoUrl}
                alt={business?.name ?? "Logo"}
                className="h-16 md:h-20 max-w-[220px] object-contain mx-auto mb-5 animate-logo-float drop-shadow-lg"
              />
            )}
            <h1 className="mb-4 text-4xl md:text-6xl font-bold">
              {c.hero.title}
            </h1>
            <p className="mb-6 text-lg text-white/90">{c.hero.subtitle}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/booking" className="btn btn-primary btn-lg">
                {c.hero.primaryCta}
              </Link>
              <a href="#servicios" className="btn btn-ghost btn-lg text-white">
                {c.hero.secondaryCta}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 group/grid">
          {c.features.map((f, i) => (
            <Reveal key={i} index={i} spotlight>
              <Feature title={f.title} desc={f.description} icon={f.icon} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
          <div>
            <h2 className="text-3xl font-bold">{c.services.title}</h2>
            <p className="text-base-content/70">{c.services.subtitle}</p>
          </div>
          <Link to="/booking" className="btn btn-ghost btn-sm">
            Ver todos →
          </Link>
        </div>

        {services.length === 0 ? (
          <p className="text-center opacity-60 py-6">Cargando servicios...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 group/grid">
            {services.map((s, i) => (
              <Reveal key={s.id} index={i} spotlight className="h-full">
                <ServiceCard service={s} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-base-100 border-y border-base-300">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-2">
            {c.howItWorks.title}
          </h2>
          <p className="text-center text-base-content/70 mb-10">
            {c.howItWorks.subtitle}
          </p>

          <ul className="steps steps-vertical sm:steps-horizontal w-full">
            {c.howItWorks.steps.map((step, i) => (
              <li
                key={i}
                className="step step-primary"
                data-content={String(i + 1)}
              >
                <Reveal index={i} className="px-3 pt-2 max-w-[220px]">
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-xs opacity-70">{step.description}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* EQUIPO */}
      {employees.length > 0 && (
        <section className="container mx-auto px-4 py-12 max-w-5xl">
          <h2 className="text-3xl font-bold mb-2">{c.team.title}</h2>
          <p className="text-base-content/70 mb-6">{c.team.subtitle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 group/grid">
            {employees.map((emp, i) => (
              <Reveal key={emp.id} index={i} spotlight className="h-full">
                <div className="card bg-base-100 border border-base-300/60 shadow items-center p-5 text-center h-full transition-all duration-300 ease-out hover:scale-[1.04] hover:shadow-2xl hover:border-primary/40 hover:z-10 lg:group-hover/grid:opacity-55 lg:hover:!opacity-100 group/card">
                  <div className="avatar avatar-placeholder">
                    <div className="bg-neutral text-neutral-content w-20 rounded-full transition-transform duration-300 group-hover/card:scale-110">
                      <span className="text-xl font-bold">
                        {initials(emp.fullName)}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold mt-3">{emp.fullName}</h3>
                  <p className="text-xs opacity-60">Estilista</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* CONTACTO */}
      <section
        id="contacto"
        className="bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 border-y border-base-300"
      >
        <div className="container mx-auto px-4 py-14 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-8">
            <Reveal index={0}>
              <h2 className="text-3xl font-bold mb-3">{c.contact.title}</h2>
              <p className="text-base-content/70 mb-6 max-w-md">
                {c.contact.subtitle}
              </p>

              <div className="space-y-4">
                {business && (
                  <>
                    <ContactRow
                      icon="📞"
                      label="Teléfono"
                      value={business.phone}
                      href={`tel:${business.phone.replace(/\s/g, "")}`}
                    />
                    <ContactRow
                      icon="💬"
                      label="WhatsApp"
                      value="Escríbenos directo"
                      href={`https://wa.me/${business.whatsapp}`}
                      external
                    />
                    <ContactRow
                      icon="✉️"
                      label="Email"
                      value={business.email}
                      href={`mailto:${business.email}`}
                    />
                    <ContactRow
                      icon="📍"
                      label="Dirección"
                      value={business.address}
                      href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
                      external
                    />
                  </>
                )}
              </div>
            </Reveal>

            <Reveal index={1}>
              <div className="card bg-base-100 shadow-lg transition-shadow duration-300 hover:shadow-2xl">
                <div className="card-body">
                  <h3 className="font-bold text-lg mb-3">
                    {c.contact.hoursTitle}
                  </h3>
                  <ul className="space-y-2">
                    {hours.map((h) => (
                      <li
                        key={h.days}
                        className="flex justify-between items-center py-1.5 border-b border-base-300 last:border-b-0 text-sm"
                      >
                        <span className="font-medium">{h.days}</span>
                        <span className="text-base-content/70">{h.time}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/booking" className="btn btn-primary w-full mt-4">
                    {c.contact.ctaButton}
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <Reveal>
          <h2 className="text-3xl font-bold mb-3">{c.finalCta.title}</h2>
          <p className="text-base-content/70 mb-6">{c.finalCta.subtitle}</p>
          <Link to="/booking" className="btn btn-primary btn-lg">
            {c.finalCta.button}
          </Link>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral text-neutral-content">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={business?.name ?? "Logo"}
                  className="h-10 max-w-[140px] object-contain mb-2"
                />
              )}
              <h3 className="text-xl font-bold">{business?.name ?? "Kaiser"}</h3>
              <p className="text-sm opacity-70">{business?.address ?? ""}</p>
            </div>
            <nav className="flex flex-wrap gap-4 text-sm">
              <Link to="/booking" className="link link-hover">
                Reservar
              </Link>
              <a href="#servicios" className="link link-hover">
                Servicios
              </a>
              <a href="#contacto" className="link link-hover">
                Contacto
              </a>
              <Link to="/login" className="link link-hover">
                Acceso admin
              </Link>
            </nav>
          </div>
          <div className="text-xs opacity-60 mt-6 pt-4 border-t border-neutral-content/20">
            © {new Date().getFullYear()} {business?.name ?? "Kaiser"}. Todos los
            derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="card bg-base-100 border border-base-300/60 shadow h-full transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl hover:border-primary/40 hover:z-10 lg:group-hover/grid:opacity-55 lg:hover:!opacity-100 group/card">
      <div className="card-body items-start">
        <div className="text-3xl transition-transform duration-300 group-hover/card:scale-125 group-hover/card:-rotate-6">
          {icon}
        </div>
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm text-base-content/70">{desc}</p>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: string;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="flex items-start gap-3 p-3 rounded-box hover:bg-base-200 transition"
    >
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-base-content/60">
          {label}
        </div>
        <div className="font-semibold">{value}</div>
      </div>
    </a>
  );
}
