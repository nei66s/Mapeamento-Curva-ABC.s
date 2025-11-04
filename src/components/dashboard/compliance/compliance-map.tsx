
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Store, StoreComplianceData } from '@/lib/types';
import { isBefore, startOfDay } from 'date-fns';

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
    }
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

  }, [allStores, scheduledVisits]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '400px', width: '100%', borderRadius: 'var(--radius)' }}
    />
  );
}

    