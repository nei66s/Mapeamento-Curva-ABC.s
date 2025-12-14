
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import '@/lib/leaflet-init';
import 'leaflet/dist/leaflet.css';
import type { Incident } from '@/lib/types';
import type { Store } from '@/lib/types';
// leaflet-init handles default marker icon URLs for the build (avoid 404s).

interface IncidentMapProps {
  incidents: Incident[];
}

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


export default function IncidentMap({ incidents }: IncidentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | L.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [following, setFollowing] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const prevPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastPanRef = useRef<number>(0);
  const [stores, setStores] = useState<Store[]>([]);

  // Center on user and create/update a distinct circle marker
  const centerOnUser = useCallback(() => {
    const isMapAttached = (m?: L.Map | null) => {
      try {
        return !!m && typeof m.getContainer === 'function' && document.contains(m.getContainer());
      } catch (e) {
        return false;
      }
    };
    // Prefer to center on the already-known userLocation if present.
    if (userLocation && mapRef.current && isMapAttached(mapRef.current)) {
      try {
        mapRef.current.setView([userLocation.lat, userLocation.lng], 14);
        if (userMarkerRef.current && typeof (userMarkerRef.current as any).openPopup === 'function') {
          try { (userMarkerRef.current as any).openPopup(); } catch (e) {}
        }
      } catch (e) {
        // fallback: try to get coords and center
        // eslint-disable-next-line no-console
        console.warn('Failed to center on known location, falling back to getCurrentPosition');
      }
      return;
    }

    // If we don't have a cached userLocation, request it and create marker + center
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('Geolocation not available in this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        if (mapRef.current && isMapAttached(mapRef.current)) {
          mapRef.current.setView([lat, lng], 14);
          if (userMarkerRef.current && typeof (userMarkerRef.current as any).setLatLng === 'function') {
            (userMarkerRef.current as any).setLatLng([lat, lng]);
            try { (userMarkerRef.current as any).openPopup(); } catch (e) {}
          } else if (mapRef.current) {
            const pinHtml = `
              <div class="user-pin-wrapper" style="width:36px;height:36px;line-height:0;position:relative;">
                <div class="user-pin">
                  <svg class="pin-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
                    <circle cx="12" cy="9" r="2.5" fill="#fff" />
                  </svg>
                </div>
              </div>`;
            const divIcon = L.divIcon({ html: pinHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 36] });
            const marker = L.marker([lat, lng], { icon: divIcon });
            marker.bindPopup('<b>Você está aqui</b>');
            marker.addTo(mapRef.current);
            userMarkerRef.current = marker;
            try { marker.openPopup(); } catch (e) {}
          }
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [userLocation]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/stores');
        if (!res.ok) throw new Error('Failed to load stores');
        const data: Store[] = await res.json();
        setStores(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) {
      return;
    }

    if (mapRef.current) {
      // remove any existing user marker attached to the old map so it will be re-created on the new map
      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.remove();
        } catch (e) {
          // ignore
        }
        userMarkerRef.current = null;
      }

      // Attempt to cleanly stop animations, remove layers and event listeners before removing the map
      try {
  try { (mapRef.current as any).stop && (mapRef.current as any).stop(); } catch (e) {}
        mapRef.current.eachLayer((layer: any) => {
          try {
            if (layer && typeof layer.remove === 'function') {
              layer.remove();
            } else if (mapRef.current) {
              mapRef.current.removeLayer(layer);
            }
          } catch (e) {
            // ignore single layer removal errors
          }
        });
        mapRef.current.off();
        // Remove locate control if present
        try {
          const ctrl = (mapRef.current as any)._locateControl;
          if (ctrl && typeof ctrl.remove === 'function') ctrl.remove();
        } catch (e) {
          // ignore
        }
        try { (mapRef.current as any)._centerOnUser = undefined; (mapRef.current as any)._toggleFollow = undefined; } catch (e) {}
      } catch (e) {
        // ignore
      }

      try {
  try { (mapRef.current as any).stop && (mapRef.current as any).stop(); } catch (e) {}
        mapRef.current.remove();
      } catch (e) {
        // ignore
      }
      mapRef.current = null;
      // stop following if active
      try {
        if (watchIdRef.current != null && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchIdRef.current as number);
        }
      } catch (e) {}
      watchIdRef.current = null;
      setFollowing(false);
    }

  if (mapContainerRef.current && !mapRef.current) {
      const center: L.LatLngExpression = [-22.8, -47.2];

      const map = L.map(mapContainerRef.current).setView(center, 9);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Try to obtain the user's current position once on load and place the marker (do not change the map center)
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setUserLocation({ lat, lng });
              // add marker without centering
              if (mapRef.current) {
                if (userMarkerRef.current && typeof (userMarkerRef.current as any).setLatLng === 'function') {
                  (userMarkerRef.current as any).setLatLng([lat, lng]);
                } else {
                  const pinHtml = `
                    <div class="user-pin-wrapper" style="width:36px;height:36px;line-height:0;position:relative;">
                      <div class="user-pin">
                        <svg class="pin-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
                          <circle cx="12" cy="9" r="2.5" fill="#fff" />
                        </svg>
                      </div>
                    </div>`;
                  const divIcon = L.divIcon({ html: pinHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 36] });
                  const marker = L.marker([lat, lng], { icon: divIcon });
                  marker.bindPopup('<b>Você está aqui</b>');
                  marker.addTo(mapRef.current);
                  userMarkerRef.current = marker;
                }
              }
            },
            (err) => { /* ignore */ },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        } catch (e) {}
      }

      const incidentsWithCoords = incidents.filter(
        (incident) => incident.lat != null && incident.lng != null && (incident.status === 'Aberto' || incident.status === 'Em Andamento')
      );

      const incidentLocations = new Set(incidentsWithCoords.map((inc) => `${inc.lat},${inc.lng}`));

      // Add blue markers for all stores that DON'T have an active incident
      stores.forEach((store) => {
        const locationKey = `${store.lat},${store.lng}`;
        if (!incidentLocations.has(locationKey)) {
          L.marker([store.lat, store.lng], { icon: blueIcon })
            .addTo(map)
            .bindPopup(`<b>${store.name}</b><br>${store.city}`);
        }
      });

      // Add red markers for incidents
      incidentsWithCoords.forEach((incident) => {
        L.marker([incident.lat!, incident.lng!], { icon: redIcon })
          .addTo(map)
          .bindPopup(`<b>${incident.location}</b><br>Item: ${incident.itemName}<br>Status: ${incident.status}`);
      });

      // note: user location marker (if any) is handled in a separate effect to avoid
      // remounting the whole map whenever userLocation updates (prevents flicker)

      // Create a Leaflet control (icon-only) for 'Minha localização'
      const LocateControlClass = (L.Control as any).extend({
        onAdd: function () {
          const container = L.DomUtil.create('div', 'leaflet-control-locate');
          const btn = L.DomUtil.create('button', 'p-2 bg-white rounded-md shadow-sm', container) as HTMLButtonElement;
          btn.title = 'Minha localização';
          btn.setAttribute('aria-label', 'Minha localização');
          btn.setAttribute('role', 'button');
          btn.setAttribute('aria-pressed', 'false');
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.07a7 7 0 015.657 5.657H18a1 1 0 110 2h-1.343A7 7 0 0111 16.93V18a1 1 0 11-2 0v-1.07a7 7 0 01-5.657-5.657H2a1 1 0 110-2h1.343A7 7 0 009 4.07V3a1 1 0 011-1zM10 7a3 3 0 100 6 3 3 0 000-6z" clip-rule="evenodd" />
            </svg>
          `;
          L.DomEvent.on(btn, 'click', (e: any) => {
            L.DomEvent.stopPropagation(e);
            try {
              // prefer toggle follow if available
              if ((map as any)._toggleFollow) {
                (map as any)._toggleFollow();
              } else {
                centerOnUser();
              }
            } catch (e) {
              centerOnUser();
            }
          });
          // prevent map interactions when clicking the control
          L.DomEvent.disableClickPropagation(container);
          return container;
        }
      });
      const locateControl = new LocateControlClass({ position: 'bottomright' });
      locateControl.addTo(map);
      // store control on map object so we can remove it later if needed
      (map as any)._locateControl = locateControl;

      // expose functions for control: center and toggle follow
      (map as any)._centerOnUser = centerOnUser;
      (map as any)._toggleFollow = () => {
        if (!navigator.geolocation) return;
        if (watchIdRef.current == null) {
          // start following
          const id = navigator.geolocation.watchPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setUserLocation({ lat, lng });
              try {
                if (!mapRef.current || !document.contains(mapRef.current.getContainer())) return;
                const prev = prevPosRef.current;
                const now = Date.now();
                const movedEnough = !prev || Math.abs(prev.lat - lat) > 0.00005 || Math.abs(prev.lng - lng) > 0.00005;
                const canPan = now - lastPanRef.current > 500;
                if (movedEnough && canPan) {
                  try {
                    // prefer panTo for smoother motion and avoid forcing costly setView transitions
                    mapRef.current.panTo([lat, lng]);
                  } catch (e) {}
                  lastPanRef.current = now;
                }
                prevPosRef.current = { lat, lng };

                if (userMarkerRef.current && typeof (userMarkerRef.current as any).setLatLng === 'function') {
                  (userMarkerRef.current as any).setLatLng([lat, lng]);
                } else if (mapRef.current) {
                  const pinHtml = `
                    <div class="user-pin-wrapper" style="width:36px;height:36px;line-height:0;position:relative;">
                      <div class="user-pin">
              <svg class="pin-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
                <circle cx="12" cy="9" r="2.5" fill="#fff" />
              </svg>
            </div>
          </div>`;
                  const divIcon = L.divIcon({ html: pinHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 36] });
                  const marker = L.marker([lat, lng], { icon: divIcon });
                  marker.bindPopup('<b>Você está aqui</b>');
                  marker.addTo(mapRef.current);
                  userMarkerRef.current = marker;
                }
              } catch (e) {
                // ignore errors in follow handler
              }
            },
            (err) => { console.error('watchPosition error', err); },
            { enableHighAccuracy: true, maximumAge: 1000 }
          );
          watchIdRef.current = id as unknown as number;
          setFollowing(true);
          // toggle control button active appearance
          try {
            const btn = map.getContainer().querySelector('.leaflet-control-locate button');
            if (btn) { btn.classList.add('locate-active'); btn.setAttribute('aria-pressed','true'); }
          } catch (e) {}
        } else {
          // stop following
          try {
            navigator.geolocation.clearWatch(watchIdRef.current as number);
          } catch (e) {}
          watchIdRef.current = null;
          setFollowing(false);
          try {
            const btn = map.getContainer().querySelector('.leaflet-control-locate button');
            if (btn) { btn.classList.remove('locate-active'); btn.setAttribute('aria-pressed','false'); }
          } catch (e) {}
        }
      };
    }
  }, [incidents, stores, centerOnUser]);

  // Update or create the user marker when userLocation changes without remounting the whole map
  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    try {
      if (!document.contains(mapRef.current.getContainer())) return;
      if (userMarkerRef.current && typeof (userMarkerRef.current as any).setLatLng === 'function') {
        (userMarkerRef.current as any).setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const pinHtml = `
          <div class="user-pin-wrapper">
            <div class="user-pin-pulse"></div>
            <div class="user-pin">
              <svg class="pin-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
                <circle cx="12" cy="9" r="2.5" fill="#fff" />
              </svg>
            </div>
          </div>`;
        const divIcon = L.divIcon({ html: pinHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 36] });
        const marker = L.marker([userLocation.lat, userLocation.lng], { icon: divIcon });
        marker.bindPopup('<b>Você está aqui</b>');
        marker.addTo(mapRef.current);
        userMarkerRef.current = marker;
      }
    } catch (e) {
      // ignore marker update errors
      // eslint-disable-next-line no-console
      console.warn('Could not update user marker', e);
    }
  }, [userLocation]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className="h-[400px] w-full rounded-lg" />
    </div>
  );
}
