"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { BusFront, Clock, MapPin, Navigation } from "lucide-react";
import {
  BENGALURU_CENTER,
  CAMPUS_MARKERS,
  ROUTE_STOPS,
  ROUTE_ENDPOINTS,
  BUSES,
  busPosition,
  fetchRoadRoute,
  nextStopName,
  tickBus,
} from "../lib/bus-data";

// --- Leaflet setup (client-only) ------------------------------------------

function makeBusIcon(status) {
  const color =
    status === "Delayed"
      ? "#dc2626"
      : status === "Arriving"
      ? "#16a34a"
      : "#2563eb";
  const html = `
    <div style="position:relative;width:36px;height:36px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.18;animation:buspulse 2s ease-out infinite;"></div>
      <div style="position:absolute;top:4px;left:4px;width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-7C20.1 4.8 19.1 4 18 4H6c-1 0-2 .8-2.4 1.8L2.2 12.8c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2C2.5 16.3 3 18 3 18h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
      </div>
    </div>`;
  return L.divIcon({
    html,
    className: "bus-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function makeCampusIcon(label, color = "#2563eb") {
  const isScaler = label.includes("Scaler");
  const bgColor = isScaler ? "#dc2626" : color;
  return L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:18px;height:18px;border-radius:50%;background:${bgColor};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
        <div style="background:white;border-radius:4px;padding:1px 5px;font-size:10px;font-weight:600;color:${bgColor};box-shadow:0 1px 3px rgba(0,0,0,0.15);white-space:nowrap;">${label}</div>
      </div>`,
    className: "campus-marker",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Fit map bounds to show the entire route
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [bounds, map]);
  return null;
}

// --- Info panel ------------------------------------------------------------

function BusInfoRow({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="flex items-center gap-1.5 text-slate-500">
        <Icon size={12} />
        {label}
      </span>
      <span className={`font-medium text-slate-700 ${valueClass}`}>{value}</span>
    </div>
  );
}

function statusBadgeClass(status) {
  if (status === "Delayed") return "bg-red-50 text-red-600 border-red-200";
  if (status === "Arriving") return "bg-emerald-50 text-emerald-600 border-emerald-200";
  return "bg-blue-50 text-blue-600 border-blue-200";
}

// --- Main component --------------------------------------------------------

export default function LiveMapTracker({ hostel }) {
  const [mounted, setMounted] = useState(false);
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [roadGeometry, setRoadGeometry] = useState(null);
  const [geometryLoading, setGeometryLoading] = useState(true);
  const tickRef = useRef(null);

  // Leaflet only runs in the browser.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset buses when hostel changes.
  useEffect(() => {
    const initial = (BUSES[hostel] || []).map((b) => ({ ...b }));
    setBuses(initial);
    setSelectedBusId(initial[0]?.id ?? null);
  }, [hostel]);

  // Fetch real road route from OSRM when hostel changes
  useEffect(() => {
    setGeometryLoading(true);
    setRoadGeometry(null);
    const endpoints = ROUTE_ENDPOINTS[hostel];
    if (!endpoints) {
      setGeometryLoading(false);
      return;
    }
    (async () => {
      const geom = await fetchRoadRoute(endpoints.forward.from, endpoints.forward.to);
      setRoadGeometry(geom);
      setGeometryLoading(false);
    })();
  }, [hostel]);

  // Animate bus positions every 2s along the real road geometry
  useEffect(() => {
    if (!buses.length) return;
    tickRef.current = setInterval(() => {
      setBuses((prev) => prev.map((b) => tickBus(b, 0.012)));
    }, 2000);
    return () => clearInterval(tickRef.current);
  }, [buses.length]);

  const stops = ROUTE_STOPS[hostel] || [];
  const selectedBus = buses.find((b) => b.id === selectedBusId) ?? buses[0];

  // Compute bounds from road geometry or stops
  const bounds = useMemo(() => {
    if (roadGeometry && roadGeometry.length >= 2) {
      return L.latLngBounds(roadGeometry.map((p) => [p[0], p[1]]));
    }
    if (stops.length >= 2) {
      return L.latLngBounds(stops.map((s) => s.coords));
    }
    return null;
  }, [roadGeometry, stops]);

  const mapKey = `map-${hostel}`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14.5px] font-semibold text-slate-800">
          Live Map Tracker
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-slate-200 h-[320px] sm:h-[380px]">
        {mounted ? (
          <MapContainer
            key={mapKey}
            center={BENGALURU_CENTER}
            zoom={13}
            scrollWheelZoom={false}
            className="w-full h-full z-0"
            attributionControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds bounds={bounds} />

            {/* Real road route polyline */}
            {roadGeometry && roadGeometry.length >= 2 && (
              <Polyline
                positions={roadGeometry}
                pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.7, dashArray: "8 6" }}
              />
            )}
            {geometryLoading && !roadGeometry && stops.length >= 2 && (
              <Polyline
                positions={stops.map((s) => s.coords)}
                pathOptions={{ color: "#93c5fd", weight: 3, opacity: 0.5, dashArray: "4 4" }}
              />
            )}

            {/* Permanent campus markers */}
            {CAMPUS_MARKERS.map((marker) => (
              <Marker
                key={marker.name}
                position={marker.coords}
                icon={makeCampusIcon(marker.name, marker.color)}
              >
                <Popup>
                  <div className="text-[11px]">
                    <div className="font-semibold text-slate-800">{marker.name}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Live bus markers */}
            {buses.map((bus) => {
              const pos = busPosition(bus, roadGeometry);
              return (
                <Marker
                  key={bus.id}
                  position={pos}
                  icon={makeBusIcon(bus.status)}
                  eventHandlers={{ click: () => setSelectedBusId(bus.id) }}
                >
                  <Popup>
                    <div className="text-[11px] min-w-[140px]">
                      <div className="font-semibold text-slate-800 mb-0.5">
                        {bus.number}
                      </div>
                      <div className="text-slate-500 mb-1">{bus.routeName}</div>
                      <div className="text-slate-600">
                        Next stop: {nextStopName(bus.routeKey, bus.direction === "forward" ? 1 : 0)}
                      </div>
                      <div className="text-slate-600">
                        ETA: {bus.etaMinutes} min · {bus.status}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-[12px]">
            Loading map…
          </div>
        )}

        {/* Floating info card */}
        {selectedBus && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto sm:w-[230px] bg-white/95 backdrop-blur rounded-lg border border-slate-200 shadow-sm p-2.5 z-[400] pointer-events-auto">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-semibold text-slate-800 flex items-center gap-1.5">
                <BusFront size={13} className="text-blue-600" />
                {selectedBus.number}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${statusBadgeClass(selectedBus.status)}`}>
                {selectedBus.status}
              </span>
            </div>
            <div className="space-y-1">
              <BusInfoRow icon={Navigation} label="Route" value={selectedBus.routeName} />
              <BusInfoRow icon={MapPin} label="Next stop" value={nextStopName(selectedBus.routeKey, selectedBus.direction === "forward" ? 1 : 0)} />
              <BusInfoRow icon={Clock} label="ETA" value={`${selectedBus.etaMinutes} min`} />
            </div>
          </div>
        )}
      </div>

      {/* Bus selector chips */}
      {buses.length > 1 && (
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {buses.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBusId(b.id)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                selectedBusId === b.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {b.number}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
