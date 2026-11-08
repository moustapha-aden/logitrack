// Lieux et itinéraires illustratifs (coordonnées approximatives, usage démonstratif).

export interface Place {
  id: string;
  name: string;
  short: string;
  region: string;
  lat: number;
  lng: number;
  kind: "port" | "zone" | "ville" | "frontiere" | "international";
}

export const PLACES: Place[] = [
  { id: "port-djibouti", name: "Port de Djibouti", short: "Port de Djibouti", region: "Djibouti-ville", lat: 11.6005, lng: 43.1395, kind: "port" },
  { id: "doraleh", name: "Terminal de Doraleh", short: "Doraleh", region: "Djibouti-ville", lat: 11.5935, lng: 43.0705, kind: "port" },
  { id: "damerjog", name: "Zone industrielle de Damerjog", short: "Damerjog", region: "Djibouti-ville", lat: 11.5155, lng: 43.2135, kind: "zone" },
  { id: "pk12", name: "Zone logistique PK12", short: "PK12", region: "Djibouti-ville", lat: 11.5405, lng: 43.1045, kind: "zone" },
  { id: "djibouti-ville", name: "Djibouti-ville", short: "Djibouti", region: "Djibouti-ville", lat: 11.5885, lng: 43.1455, kind: "ville" },
  { id: "arta", name: "Arta", short: "Arta", region: "Arta", lat: 11.5245, lng: 42.8485, kind: "ville" },
  { id: "ali-sabieh", name: "Ali Sabieh", short: "Ali Sabieh", region: "Ali Sabieh", lat: 11.1555, lng: 42.7125, kind: "ville" },
  { id: "dikhil", name: "Dikhil", short: "Dikhil", region: "Dikhil", lat: 11.1085, lng: 42.3735, kind: "ville" },
  { id: "tadjourah", name: "Tadjourah", short: "Tadjourah", region: "Tadjourah", lat: 11.7875, lng: 42.8835, kind: "ville" },
  { id: "galafi", name: "Poste frontière de Galafi", short: "Galafi", region: "Dikhil", lat: 11.7165, lng: 41.8375, kind: "frontiere" },
  { id: "guelile", name: "Poste frontière de Guelilé", short: "Guelilé", region: "Ali Sabieh", lat: 10.9905, lng: 42.6455, kind: "frontiere" },
  { id: "dire-dawa", name: "Dire Dawa (Éthiopie)", short: "Dire Dawa", region: "Éthiopie", lat: 9.6005, lng: 41.8505, kind: "international" },
];

export const placeById = (id: string): Place | undefined => PLACES.find((p) => p.id === id);
export const placeName = (id: string): string => placeById(id)?.short ?? id;

type LatLng = [number, number];
const P = (id: string): LatLng => {
  const p = placeById(id);
  return p ? [p.lat, p.lng] : [11.59, 43.14];
};

// Points intermédiaires des corridors (tracés simplifiés, non contractuels)
const CORRIDOR_RN1: LatLng[] = [P("pk12"), [11.47, 42.98], P("arta"), [11.33, 42.62], P("dikhil"), [11.29, 42.11], [11.52, 41.95], P("galafi")];
const CORRIDOR_RN5: LatLng[] = [P("pk12"), [11.42, 42.95], [11.28, 42.83], P("ali-sabieh"), P("guelile"), [10.45, 42.35], [9.95, 42.05], P("dire-dawa")];

/** Construit un itinéraire illustratif entre deux lieux. */
export function buildRoute(originId: string, destinationId: string): LatLng[] {
  const o = P(originId);
  const d = P(destinationId);
  const coastal = ["port-djibouti", "doraleh", "djibouti-ville", "pk12", "damerjog"];
  const towardsRn1 = ["arta", "dikhil", "galafi"];
  const towardsRn5 = ["ali-sabieh", "guelile", "dire-dawa"];

  const corridorTo = (dest: string, path: LatLng[]) => {
    const idx = path.findIndex((pt) => pt[0] === P(dest)[0] && pt[1] === P(dest)[1]);
    return idx >= 0 ? path.slice(0, idx + 1) : path;
  };

  if (coastal.includes(originId) && towardsRn1.includes(destinationId)) {
    return [o, ...corridorTo(destinationId, CORRIDOR_RN1)];
  }
  if (coastal.includes(originId) && towardsRn5.includes(destinationId)) {
    return [o, ...corridorTo(destinationId, CORRIDOR_RN5)];
  }
  if (destinationId === "tadjourah") {
    return [o, P("pk12"), [11.47, 42.98], P("arta"), [11.62, 42.68], [11.78, 42.75], d];
  }
  // trajets urbains ou retours : ligne légèrement incurvée
  const mid: LatLng = [(o[0] + d[0]) / 2 + 0.02, (o[1] + d[1]) / 2 - 0.02];
  return [o, mid, d];
}

/** Position fictive sur l'itinéraire selon un ratio de progression 0..1. */
export function pointAlong(route: LatLng[], ratio: number): LatLng {
  if (route.length === 1) return route[0];
  const segs = route.slice(1).map((pt, i) => {
    const a = route[i];
    return { a, b: pt, len: Math.hypot(pt[0] - a[0], pt[1] - a[1]) };
  });
  const total = segs.reduce((s, x) => s + x.len, 0);
  let target = Math.max(0, Math.min(1, ratio)) * total;
  for (const s of segs) {
    if (target <= s.len) {
      const t = s.len === 0 ? 0 : target / s.len;
      return [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t];
    }
    target -= s.len;
  }
  return route[route.length - 1];
}

/** Distance routière indicative en km (approximation). */
export function routeDistanceKm(originId: string, destinationId: string): number {
  const route = buildRoute(originId, destinationId);
  let km = 0;
  for (let i = 1; i < route.length; i++) {
    const [lat1, lng1] = route[i - 1];
    const [lat2, lng2] = route[i];
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    km += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return Math.round(km * 1.15);
}
