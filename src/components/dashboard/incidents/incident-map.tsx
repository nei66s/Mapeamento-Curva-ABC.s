
'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Incident } from '@/lib/types';
import type { Store } from '@/lib/types';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

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


export default function IncidentMap({ incidents }: IncidentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

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
        mapRef.current.remove();
        mapRef.current = null;
    }

    if (mapContainerRef.current && !mapRef.current) {
        const center: L.LatLngExpression = [-22.8, -47.2];

        const map = L.map(mapContainerRef.current).setView(
            center,
            9 
        );
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const incidentsWithCoords = incidents.filter(
            incident => incident.lat != null && incident.lng != null && (incident.status === 'Aberto' || incident.status === 'Em Andamento')
        );

        const incidentLocations = new Set(incidentsWithCoords.map(inc => `${inc.lat},${inc.lng}`));

    // Add blue markers for all stores that DON'T have an active incident
    stores.forEach(store => {
            const locationKey = `${store.lat},${store.lng}`;
            if (!incidentLocations.has(locationKey)) {
                 L.marker([store.lat, store.lng], { icon: blueIcon })
                .addTo(map)
                .bindPopup(`<b>${store.name}</b><br>${store.city}`);
            }
        });
        
        // Add red markers for incidents
        incidentsWithCoords.forEach(incident => {
            L.marker([incident.lat!, incident.lng!], { icon: redIcon })
            .addTo(map)
            .bindPopup(`<b>${incident.location}</b><br>Item: ${incident.itemName}<br>Status: ${incident.status}`);
        });
    }

  }, [incidents, stores]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '400px', width: '100%', borderRadius: 'var(--radius)' }}
    />
  );
}
