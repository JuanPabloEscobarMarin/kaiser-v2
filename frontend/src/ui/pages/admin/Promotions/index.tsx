import { useEffect, useMemo, useState } from "react";
import { ApiError, campaignsApi, servicesApi } from "@/core/api";
import type {
  Campaign,
  CampaignChannel,
  CampaignSegment,
} from "@/core/api/campaigns.api";
import type { Service } from "@/core/types";
import { useNotify } from "@/ui/hooks/useNotify";

const SEGMENT_LABELS: Record<CampaignSegment, string> = {
  ALL: "Todos los clientes",
  BIRTHDAY_MONTH: "Cumpleañeros del mes",
  INACTIVE: "Clientes inactivos",
  BY_SERVICE: "Por servicio",
};

export function PromotionsPage() {
  const notify = useNotify();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<CampaignChannel>("EMAIL");
  const [segment, setSegment] = useState<CampaignSegment>("ALL");
  const [segmentParam, setSegmentParam] = useState("");
  const [preview, setPreview] = useState<{
    total: number;
    withEmail: number;
    withPhone: number;
  } | null>(null);
  const [sending, setSending] = useState(false);

  const loadCampaigns = () =>
    campaignsApi.list().then(setCampaigns).catch(() => setCampaigns([]));

  useEffect(() => {
    loadCampaigns();
    servicesApi.list().then(setServices).catch(() => setServices([]));
  }, []);

  // Vista previa de la audiencia según el segmento elegido.
  useEffect(() => {
    const param =
      segment === "INACTIVE" || segment === "BY_SERVICE"
        ? segmentParam || null
        : null;
    if (segment === "BY_SERVICE" && !param) {
      setPreview(null);
      return;
    }
    let active = true;
    campaignsApi
      .audiencePreview(segment, param)
      .then((p) => {
        if (active) setPreview(p);
      })
      .catch(() => {
        if (active) setPreview(null);
      });
    return () => {
      active = false;
    };
  }, [segment, segmentParam]);

  const needsParam = segment === "INACTIVE" || segment === "BY_SERVICE";

  const canSend = useMemo(
    () =>
      title.trim().length > 0 &&
      body.trim().length > 0 &&
      (!needsParam || segmentParam.trim().length > 0) &&
      !sending,
    [title, body, needsParam, segmentParam, sending],
  );

  const send = async () => {
    if (!canSend) return;
    if (
      !confirm(
        `¿Enviar la campaña a ${preview?.total ?? "los"} cliente(s) del segmento "${SEGMENT_LABELS[segment]}"?`,
      )
    ) {
      return;
    }
    setSending(true);
    try {
      const res = await campaignsApi.create({
        title: title.trim(),
        body: body.trim(),
        channel,
        segment,
        segmentParam: needsParam ? segmentParam.trim() : null,
      });
      notify.setMessage({
        label: res.emailConfigured
          ? `Campaña enviada: ${res.emailsSent} correo(s) a ${res.audienceCount} cliente(s).`
          : `Campaña registrada (${res.audienceCount} destinatarios). El correo no está configurado (Resend): no se envió ninguno.`,
        type: res.emailConfigured ? "success" : "warning",
      });
      notify.notify();
      setTitle("");
      setBody("");
      loadCampaigns();
    } catch (err) {
      notify.setMessage({
        label: err instanceof ApiError ? err.message : "Error al enviar",
        type: "error",
      });
      notify.notify();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Promociones</h1>
        <p className="text-sm opacity-70">
          Crea y envía campañas a tus clientes por correo y/o WhatsApp.
        </p>
      </div>

      <section className="card bg-base-100 shadow">
        <div className="card-body space-y-3">
          <fieldset>
            <legend className="text-sm font-medium mb-1">Título / asunto</legend>
            <input
              type="text"
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: 20% de descuento este mes"
            />
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium mb-1">Mensaje</legend>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe el mensaje de la promoción…"
            />
          </fieldset>

          <div className="grid sm:grid-cols-2 gap-3">
            <fieldset>
              <legend className="text-sm font-medium mb-1">Canal</legend>
              <select
                className="select select-bordered w-full"
                value={channel}
                onChange={(e) => setChannel(e.target.value as CampaignChannel)}
              >
                <option value="EMAIL">Correo</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="BOTH">Correo + WhatsApp</option>
              </select>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium mb-1">Segmento</legend>
              <select
                className="select select-bordered w-full"
                value={segment}
                onChange={(e) => {
                  setSegment(e.target.value as CampaignSegment);
                  setSegmentParam("");
                }}
              >
                {(Object.keys(SEGMENT_LABELS) as CampaignSegment[]).map((s) => (
                  <option key={s} value={s}>
                    {SEGMENT_LABELS[s]}
                  </option>
                ))}
              </select>
            </fieldset>
          </div>

          {segment === "BY_SERVICE" && (
            <fieldset>
              <legend className="text-sm font-medium mb-1">Servicio</legend>
              <select
                className="select select-bordered w-full"
                value={segmentParam}
                onChange={(e) => setSegmentParam(e.target.value)}
              >
                <option value="">— elige un servicio —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </fieldset>
          )}

          {segment === "INACTIVE" && (
            <fieldset>
              <legend className="text-sm font-medium mb-1">
                Días sin visitar (por defecto 60)
              </legend>
              <input
                type="number"
                min="1"
                className="input input-bordered w-full"
                value={segmentParam}
                onChange={(e) => setSegmentParam(e.target.value)}
                placeholder="60"
              />
            </fieldset>
          )}

          {preview && (
            <div className="alert alert-info text-sm">
              <span>
                Audiencia: <strong>{preview.total}</strong> cliente(s) ·{" "}
                {preview.withEmail} con correo · {preview.withPhone} con teléfono
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={send}
              disabled={!canSend}
            >
              {sending && <span className="loading loading-spinner" />}
              Enviar campaña
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Historial de campañas</h2>
        <div className="overflow-x-auto bg-base-100 rounded-box shadow">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título</th>
                <th>Canal</th>
                <th>Segmento</th>
                <th>Destinatarios</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap">
                    {(c.sentAt ?? c.createdAt).slice(0, 10)}
                  </td>
                  <td>{c.title}</td>
                  <td>{c.channel}</td>
                  <td>{SEGMENT_LABELS[c.segment]}</td>
                  <td>{c.recipientCount}</td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center opacity-60 py-6">
                    Aún no has enviado campañas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
