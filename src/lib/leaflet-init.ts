import L from 'leaflet';

// Use CDN-hosted Leaflet assets so Next.js' image optimizer does not need to run in this environment.
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

// Initialize Leaflet default icon paths to avoid 404 requests to /marker-icon.png
// which occur when Leaflet's CSS expects assets at the server root.
try {
  // Some bundlers (Next.js/webpack) export image imports as objects { src, height, width }.
  // Prefer the .src value if present, otherwise fall back to the import itself.
  const resolvedIconUrl = (iconUrl as any)?.src ?? (iconUrl as any) ?? '';
  const resolvedRetina = (iconRetinaUrl as any)?.src ?? (iconRetinaUrl as any) ?? resolvedIconUrl;
  const resolvedShadow = (shadowUrl as any)?.src ?? (shadowUrl as any) ?? '';

  // @ts-ignore
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  // @ts-ignore
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: resolvedRetina,
    iconUrl: resolvedIconUrl,
    shadowUrl: resolvedShadow,
  });
} catch (e) {
  // ignore — this module is safe to import in non-browser environments
}

export {};
