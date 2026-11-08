"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { MISSION_STATUS, OPERATION_STEPS } from "@/lib/constants";
import { buildRoute, placeName, PLACES, pointAlong } from "@/lib/data/geo";
import { missionStatus } from "@/lib/utils";
import type { Mission, Truck } from "@/types";

export interface MapProps {
  missions: Mission[];
  trucks: Truck[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number | string;
}

const STATUS_COLOR = { planifiee: "#94A3B8", en_cours: "#2563EB", en_retard: "#F59E0B", terminee: "#0F9F83" } as const;

/** Ratio de progression fictif sur l'itinéraire selon l'étape. */
function ratioFor(m: Mission): number {
  if (m.step <= 3) return 0;
  if (m.step >= 5) return 1;
  const hash = [...m.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return 0.25 + (hash % 50) / 100;
}

function truckIcon(color: string, selected: boolean) {
  return L.divIcon({
    className: "truck-marker",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:999px;background:${color};border:3px solid #fff;box-shadow:0 4px 12px rgba(16,30,53,.35)${selected ? `,0 0 0 6px ${color}40` : ""};display:flex;align-items:center;justify-content:center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
    </div>`,
  });
}

function FitToSelection({ selected }: { selected?: Mission }) {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(t);
  }, [map]);
  const origin = selected?.origin;
  const destination = selected?.destination;
  useEffect(() => {
    if (!origin || !destination) return;
    map.fitBounds(L.latLngBounds(buildRoute(origin, destination)), { padding: [40, 40], maxZoom: 11 });
  }, [origin, destination, map]);
  return null;
}

export default function DjiboutiMap({ missions, trucks, selectedId, onSelect, height = 460 }: MapProps) {
  const selected = missions.find((m) => m.id === selectedId);
  const items = useMemo(
    () =>
      missions.map((m) => {
        const route = buildRoute(m.origin, m.destination);
        const status = missionStatus(m);
        return { m, route, status, pos: pointAlong(route, ratioFor(m)), truck: trucks.find((t) => t.id === m.truckId) };
      }),
    [missions, trucks],
  );

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ height }}>
      <MapContainer center={[11.25, 42.6]} zoom={8} minZoom={6} maxZoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }} attributionControl>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitToSelection selected={selected} />
        {items.map(({ m, route, status }) => {
          const isSel = m.id === selectedId;
          return (
            <Polyline
              key={`r-${m.id}`}
              positions={route}
              pathOptions={{ color: STATUS_COLOR[status], weight: isSel ? 5 : 3, opacity: selectedId && !isSel ? 0.25 : 0.85, dashArray: status === "planifiee" ? "6 8" : undefined }}
              eventHandlers={{ click: () => onSelect?.(m.id) }}
            />
          );
        })}
        {PLACES.map((p) => (
          <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={p.kind === "port" ? 7 : 5} pathOptions={{ color: "#fff", weight: 2, fillColor: p.kind === "port" ? "#101E35" : p.kind === "frontiere" ? "#EF4444" : "#475569", fillOpacity: 1 }}>
            <Tooltip direction="top" offset={[0, -6]}>
              <strong>{p.name}</strong>
              <br />
              <span style={{ color: "#64748b" }}>{p.region}</span>
            </Tooltip>
          </CircleMarker>
        ))}
        {items
          .filter(({ status }) => status !== "terminee")
          .map(({ m, pos, status, truck }) => (
            <Marker key={`t-${m.id}`} position={pos} icon={truckIcon(STATUS_COLOR[status], m.id === selectedId)} eventHandlers={{ click: () => onSelect?.(m.id) }}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{m.ref}</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    {placeName(m.origin)} → {placeName(m.destination)}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {truck?.plate ?? "Camion non affecté"} · {MISSION_STATUS[status].label}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{OPERATION_STEPS[m.step].label}</div>
                  <div style={{ marginTop: 6, fontSize: 11, color: "#b45309" }}>Position fictive — démonstration</div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
      <div className="pointer-events-none absolute top-3 right-3 z-[400] max-w-[60%] rounded-lg bg-white/95 px-3 py-2 text-right text-[11px] shadow-card backdrop-blur">
        <p className="font-semibold text-amber-700">⚠ Itinéraires et positions illustratifs</p>
        <p className="hidden text-slate-500 sm:block">Aucune donnée GPS réelle — suivi manuel (v1)</p>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-white/95 px-3 py-2 text-[11px] text-slate-600 shadow-card">
        {(Object.keys(STATUS_COLOR) as (keyof typeof STATUS_COLOR)[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-1 w-4 rounded-full" style={{ backgroundColor: STATUS_COLOR[k] }} />
            {MISSION_STATUS[k].label}
          </span>
        ))}
      </div>
    </div>
  );
}
