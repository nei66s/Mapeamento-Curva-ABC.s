
"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import '@/lib/leaflet-init';
import 'leaflet/dist/leaflet.css';
import type { Store, StoreComplianceData } from '@/lib/types';
import { isBefore, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Import marker icons
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface ComplianceMapProps {
  allStores: Store[];
  scheduledVisits: StoreComplianceData[];
}

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

const orangeIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

const greyIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});


export default function ComplianceMap({ allStores, scheduledVisits }: ComplianceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const userMarkerRef = useRef<L.CircleMarker | L.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [following, setFollowing] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
        // Fix for icon path issue with Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: iconRetinaUrl.src,
            iconUrl: iconUrl.src,
            shadowUrl: shadowUrl.src,
        });
        
  const map = L.map(mapContainerRef.current).setView([-22.8, -47.2], 9);
  mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        markersRef.current.addTo(map);

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
                    marker.addTo(mapRef.current as L.Map);
                    userMarkerRef.current = marker;
                  }
                }
              },
              (err) => { /* ignore */ },
              { enableHighAccuracy: true, timeout: 8000 }
            );
          } catch (e) {}
        }

        // Create locate control (icon-only) and attach
        const LocateControlClass = (L.Control as any).extend({
          onAdd: function () {
            const container = L.DomUtil.create('div', 'leaflet-control-locate');
            const btn = L.DomUtil.create('button', 'p-2 bg-card rounded-md shadow-sm', container) as HTMLButtonElement;
            btn.title = 'Minha localização';
            // accessibility
            btn.setAttribute('aria-label', 'Minha localização');
            btn.setAttribute('role', 'button');
            btn.setAttribute('aria-pressed', 'false');
            btn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.07a7 7 0 015.657 5.657H18a1 1 0 110 2h-1.343A7 7 0 0111 16.93V18a1 1 0 11-2 0v-1.07a7 7 0 01-5.657-5.657H2a1 1 0 110-2h1.343A7 7 0 009 4.07V3a1 1 0 011-1zM10 7a3 3 0 100 6 3 3 0 000-6z" clip-rule="evenodd" />
              </svg>
            `;
                L.DomEvent.on(btn, 'click', (e: any) => {
                  L.DomEvent.stopPropagation(e);
                  // call centerOnUser or toggle follow (defined below)
                  try { (map as any)._toggleFollow ? (map as any)._toggleFollow() : ((map as any)._centerOnUser && (map as any)._centerOnUser()); } catch (err) {}
                });
            L.DomEvent.disableClickPropagation(container);
            return container;
          }
        });
  const locateControl = new LocateControlClass({ position: 'bottomright' });
  locateControl.addTo(map);
  (map as any)._locateControl = locateControl;

        // expose center & toggle functions on map (will be set later via effect)
        // stop watch when map removed/unmounted (best effort) - exposed on map removal earlier
    }
  }, []);

  // cleanup watcher on unmount
  useEffect(() => {
    return () => {
      try { if (watchIdRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current as number); } catch (e) {}
      watchIdRef.current = null;
    };
  }, []);


  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    markersRef.current.clearLayers();
    
    const storeStatusMap = new Map<string, 'completed' | 'pending' | 'future'>();
    const today = startOfDay(new Date());

    scheduledVisits.forEach(visit => {
        const hasPending = visit.items.some(item => item.status === 'pending');
        const visitDate = startOfDay(new Date(visit.visitDate));

        if (isBefore(visitDate, today)) {
             storeStatusMap.set(visit.storeId, hasPending ? 'pending' : 'completed');
        } else {
             storeStatusMap.set(visit.storeId, 'future');
        }
    });

    allStores.forEach(store => {
        let icon = greyIcon;
        let popupText = `<b>${store.name}</b><br>${store.city}<br>Sem visita no período.`;
        const status = storeStatusMap.get(store.id);

        if (status === 'completed') {
            icon = greenIcon;
            popupText = `<b>${store.name}</b><br>${store.city}<br>Status: Concluído`;
        } else if (status === 'pending') {
            icon = orangeIcon;
            popupText = `<b>${store.name}</b><br>${store.city}<br>Status: Pendente/Atrasado`;
        } else if (status === 'future') {
            icon = blueIcon;
            popupText = `<b>${store.name}</b><br>${store.city}<br>Status: Agendado`;
        }
        
        L.marker([store.lat, store.lng], { icon })
            .bindPopup(popupText)
            .addTo(markersRef.current);
    });
    // If user location exists, add/update a distinct divIcon pin (professional)
    if (userLocation) {
      if (userMarkerRef.current && typeof (userMarkerRef.current as any).setLatLng === 'function') {
        (userMarkerRef.current as any).setLatLng([userLocation.lat, userLocation.lng]);
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
        const marker = L.marker([userLocation.lat, userLocation.lng], { icon: divIcon });
        marker.bindPopup('<b>Você está aqui</b>');
        marker.addTo(map);
        userMarkerRef.current = marker;
      }
    }

  }, [allStores, scheduledVisits]);

  const centerOnUser = () => {
    const isMapAttached = (m?: L.Map | null) => {
      try { return !!m && typeof m.getContainer === 'function' && document.contains(m.getContainer()); } catch (e) { return false; }
    };

    // If we already have the user's coordinates, just center on them and open popup
    if (userLocation && mapRef.current && isMapAttached(mapRef.current)) {
      try {
        mapRef.current.setView([userLocation.lat, userLocation.lng], 14);
        if (userMarkerRef.current && typeof (userMarkerRef.current as any).openPopup === 'function') {
          try { (userMarkerRef.current as any).openPopup(); } catch (e) {}
        }
      } catch (e) {
        console.warn('Failed to center on known userLocation, falling back to getCurrentPosition');
      }
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast({ title: 'Geolocalização indisponível', description: 'Seu navegador não suporta Geolocation.' });
      return;
    }

    setLocating(true);
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
            marker.addTo(mapRef.current).bindPopup('<b>Você está aqui</b>').openPopup();
            userMarkerRef.current = marker;
          }
        }
        setLocating(false);
        toast({ title: 'Localização obtida', description: 'Centralizado na sua posição.' });
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocating(false);
        toast({ title: 'Erro ao obter localização', description: err.message || 'Permissão negada ou tempo esgotado.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  // Expose centerOnUser on the map object so the control can call it
  useEffect(() => {
    if (mapRef.current) {
      (mapRef.current as any)._centerOnUser = centerOnUser;
    }
  }, [mapRef.current]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className="h-[400px] w-full rounded-lg" />
    </div>
  );
}

    