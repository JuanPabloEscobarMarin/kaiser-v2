import type { BusinessSettings } from "@/core/types";

const ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <path d="M12 2.2c3.2 0 3.58 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.2 8.8 2.2 12 2.2Zm0 3.05A6.75 6.75 0 1 0 18.75 12 6.75 6.75 0 0 0 12 5.25Zm0 11.13A4.38 4.38 0 1 1 16.38 12 4.38 4.38 0 0 1 12 16.38Zm6.96-11.4a1.58 1.58 0 1 1-1.57-1.58 1.58 1.58 0 0 1 1.57 1.58Z" />
  ),
  facebook: (
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
  ),
  tiktok: (
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12v-3.2a5.8 5.8 0 0 0-.77-.05 5.79 5.79 0 1 0 5.79 5.79V9.01a7.35 7.35 0 0 0 4.31 1.38V7.3a4.28 4.28 0 0 1-3.15-1.48Z" />
  ),
  youtube: (
    <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.6 3.9 12 3.9 12 3.9s-7.6 0-9.4.5A3 3 0 0 0 .5 6.5 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.5ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
  ),
  whatsapp: (
    <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35ZM12 2a10 10 0 0 0-8.53 15.26L2 22l4.86-1.44A10 10 0 1 0 12 2Z" />
  ),
};

const LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
};

export function SocialLinks({
  business,
  className,
  iconClass = "w-6 h-6",
}: {
  business: BusinessSettings | null;
  className?: string;
  iconClass?: string;
}) {
  if (!business) return null;
  const links = [
    { key: "instagram", url: business.instagramUrl },
    { key: "facebook", url: business.facebookUrl },
    { key: "tiktok", url: business.tiktokUrl },
    { key: "youtube", url: business.youtubeUrl },
    {
      key: "whatsapp",
      url: business.whatsapp ? `https://wa.me/${business.whatsapp}` : null,
    },
  ].filter((l): l is { key: string; url: string } => Boolean(l.url));

  if (links.length === 0) return null;

  return (
    <div className={className ?? "flex items-center gap-3"}>
      {links.map((l) => (
        <a
          key={l.key}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={LABELS[l.key]}
          title={LABELS[l.key]}
          className="opacity-80 hover:opacity-100 hover:scale-110 transition-transform"
        >
          <svg
            className={iconClass}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            {ICONS[l.key]}
          </svg>
        </a>
      ))}
    </div>
  );
}
