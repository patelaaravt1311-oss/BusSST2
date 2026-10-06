// Real geocoded locations for SST bus system in Bengaluru.
// Coordinates verified via OpenStreetMap Nominatim.
// Road routes fetched at runtime from OSRM (router.project-osrm.org).

// UniWorld 1 — UniWorld India, Neeladri Road, Electronic City
export const UNIWORLD_1 = {
  name: "UniWorld 1",
  coords: [12.8408897, 77.6446158],
};

// UniWorld 2 — Skyward Tech Park, Velankani Drive, Electronic City
export const UNIWORLD_2 = {
  name: "UniWorld 2",
  coords: [12.8496058, 77.6593116],
};

// Scaler School of Technology — 3rd Cross Road, Electronic City Phase 1
export const SCALER_CAMPUS = {
  name: "Scaler School of Technology",
  coords: [12.8386374, 77.6643134],
};

// Center point between all three locations for initial map view
export const BENGALURU_CENTER = [12.843, 77.655];

export const HOSTELS = {
  "Uni 1": UNIWORLD_1,
  "Uni 2": UNIWORLD_2,
};

// Permanent labeled markers shown on every map view
export const CAMPUS_MARKERS = [
  { ...UNIWORLD_1, color: "#2563eb" },
  { ...UNIWORLD_2, color: "#2563eb" },
  { ...SCALER_CAMPUS, color: "#dc2626" },
];

// Route endpoints — used to fetch real road geometry from OSRM
export const ROUTE_ENDPOINTS = {
  "Uni 1": {
    forward: { from: UNIWORLD_1.coords, to: SCALER_CAMPUS.coords },
    reverse: { from: SCALER_CAMPUS.coords, to: UNIWORLD_1.coords },
  },
  "Uni 2": {
    forward: { from: UNIWORLD_2.coords, to: SCALER_CAMPUS.coords },
    reverse: { from: SCALER_CAMPUS.coords, to: UNIWORLD_2.coords },
  },
};

// Stop labels for display
export const ROUTE_STOPS = {
  "Uni 1": [
    { name: "UniWorld 1", coords: UNIWORLD_1.coords },
    { name: "Scaler School of Technology", coords: SCALER_CAMPUS.coords },
  ],
  "Uni 2": [
    { name: "UniWorld 2", coords: UNIWORLD_2.coords },
    { name: "Scaler School of Technology", coords: SCALER_CAMPUS.coords },
  ],
};

// Simulated buses — two per route (outbound + return)
export const BUSES = {
  "Uni 1": [
    {
      id: "BUS-01",
      number: "Route 1A",
      routeName: "UniWorld 1 → Scaler",
      routeKey: "Uni 1",
      direction: "forward",
      status: "On Time",
      speedKph: 28,
      nextStopIndex: 1,
      etaMinutes: 6,
      progress: 0.18,
    },
    {
      id: "BUS-02",
      number: "Route 1B",
      routeName: "Scaler → UniWorld 1",
      routeKey: "Uni 1",
      direction: "reverse",
      status: "Delayed",
      speedKph: 16,
      nextStopIndex: 0,
      etaMinutes: 14,
      progress: 0.72,
    },
  ],
  "Uni 2": [
    {
      id: "BUS-03",
      number: "Route 2A",
      routeName: "UniWorld 2 → Scaler",
      routeKey: "Uni 2",
      direction: "forward",
      status: "On Time",
      speedKph: 32,
      nextStopIndex: 1,
      etaMinutes: 8,
      progress: 0.22,
    },
    {
      id: "BUS-04",
      number: "Route 2B",
      routeName: "Scaler → UniWorld 2",
      routeKey: "Uni 2",
      direction: "reverse",
      status: "Arriving",
      speedKph: 9,
      nextStopIndex: 0,
      etaMinutes: 2,
      progress: 0.91,
    },
  ],
};

// --- Helpers ---------------------------------------------------------------

export function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function haversine(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function pointAtProgress(polyline, progress) {
  if (!polyline || polyline.length === 0) return BENGALURU_CENTER;
  if (polyline.length === 1) return polyline[0];
  const segs = [];
  let total = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = haversine(polyline[i], polyline[i + 1]);
    segs.push(d);
    total += d;
  }
  if (total === 0) return polyline[0];
  let dist = progress * total;
  for (let i = 0; i < segs.length; i++) {
    if (dist <= segs[i]) {
      const t = segs[i] === 0 ? 0 : dist / segs[i];
      return lerp(polyline[i], polyline[i + 1], t);
    }
    dist -= segs[i];
  }
  return polyline[polyline.length - 1];
}

export function nextStopName(hostelKey, nextStopIndex) {
  const stops = ROUTE_STOPS[hostelKey];
  if (nextStopIndex >= 0 && nextStopIndex < stops.length) return stops[nextStopIndex].name;
  return "—";
}

export function tickBus(bus, delta = 0.004) {
  let progress = bus.progress + delta;
  let status = bus.status;
  if (progress >= 1) {
    progress = 0.02;
    status = "On Time";
  }
  if (progress > 0.9) status = "Arriving";
  return { ...bus, progress, status };
}

export function busPosition(bus, routeGeometry) {
  const geom = routeGeometry || routePolyline(bus.routeKey);
  return pointAtProgress(geom, bus.progress);
}

// Fallback straight-line polyline (used until OSRM data loads)
export function routePolyline(hostelKey) {
  return ROUTE_STOPS[hostelKey].map((s) => s.coords);
}

// Fetch real road route from OSRM
export async function fetchRoadRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
      );
      return coords;
    }
  } catch (e) {
    // fall through to fallback
  }
  return [from, to];
}
