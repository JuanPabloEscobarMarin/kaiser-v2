import { Link } from "react-router";
import { Reveal } from "@/ui/components/Reveal";
import { SocialLinks } from "@/ui/components/SocialLinks";
import type { SectionCtx } from "./types";

const formatHours = (open: string, close: string, closed: boolean) =>
  closed ? "Cerrado" : `${open} – ${close}`;

export function Contact({ c, business }: SectionCtx) {
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

  return (
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
              <SocialLinks
                business={business}
                className="flex items-center gap-4 mt-4 text-primary"
              />
            </div>
          </Reveal>

          <Reveal index={1}>
            <div className="card bg-base-100 shadow-lg transition-shadow duration-300 hover:shadow-2xl">
              <div className="card-body">
                <h3 className="font-bold text-lg mb-3">
                  {c.contact.hoursTitle}
                </h3>
                {hours.length === 0 ? (
                  <ul className="space-y-2" aria-hidden="true">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <li
                        key={i}
                        className="flex justify-between items-center py-1.5 border-b border-base-300 last:border-b-0"
                      >
                        <div className="h-4 w-28 bg-base-300 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-base-300 rounded animate-pulse" />
                      </li>
                    ))}
                  </ul>
                ) : (
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
                )}

                <Link
                  to="/booking"
                  className="btn btn-primary w-full mt-4 hover:-translate-y-0.5 active:scale-95 transition-transform motion-reduce:transform-none"
                >
                  {c.contact.ctaButton}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
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
