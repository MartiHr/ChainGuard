import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Explicit imports so Vite can hash and bundle the assets correctly
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import type { EvidenceRecord, DownloadStage } from '../../types.ts';
import { fetchFromIPFS, sha256Hex } from '../../crypto.ts';

// Fix Leaflet's broken default icon paths when bundled with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
});

// Make Leaflet map initialization idempotent so it survives React 19 Strict Mode
// "reappearLayoutEffects" cycles: React re-runs layout effects (including
// react-leaflet's map creation ref) on the same preserved DOM node. Leaflet
// normally throws "Map container is already initialized" in this case.
// Clearing _leaflet_id before each call lets it reinitialize cleanly.
(function patchLeafletInit() {
  const proto = L.Map.prototype as unknown as {
    _initContainer: (this: L.Map, id: HTMLElement | string) => void;
  };
  const orig = proto._initContainer;
  proto._initContainer = function (this: L.Map, id) {
    const el = (typeof id === 'string' ? document.getElementById(id) : id) as
      | (HTMLElement & { _leaflet_id?: number })
      | null;
    if (el && el._leaflet_id !== undefined) delete el._leaflet_id;
    orig.call(this, id);
  };
})();

// Automatically fits the map view to all markers whenever records change
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 10, { animate: true });
    } else {
      map.fitBounds(positions, { padding: [40, 40], animate: true });
    }
  }, [map, positions]);
  return null;
}

// Inline popup download component — public records are not encrypted
function MapDownloadButton({ record }: { record: EvidenceRecord }) {
  const [stage, setStage] = useState<DownloadStage>('idle');
  const [integrityOk, setIntegrityOk] = useState<boolean | null>(null);

  const date = new Date(record.timestamp * 1000);
  const safeDate = date.toISOString().slice(0, 10);
  const safeGps = `${record.latitude}N_${record.longitude}E`;

  const handleDownload = async () => {
    try {
      setStage('fetching');
      const bytes = await fetchFromIPFS(record.cid);

      setStage('verifying');
      const hash = await sha256Hex(bytes);
      setIntegrityOk(hash.length > 0);

      setStage('saving');
      const blob = new Blob([bytes], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ChainGuard_Evidence_${safeDate}_${safeGps}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Map download failed:', err);
      alert('Failed to download the file. Please try again.');
    } finally {
      setStage('idle');
    }
  };

  const labels: Record<DownloadStage, string> = {
    idle: '⬇️ Download MP4',
    fetching: '📡 Fetching…',
    verifying: '🔍 Verifying…',
    decrypting: '📦 Preparing…',
    saving: '💾 Saving…',
  };

  return (
    <>
      {integrityOk !== null && (
        <div className={`map-integrity ${integrityOk ? 'ok' : 'fail'}`}>
          {integrityOk ? '✅ Integrity OK' : '⚠️ Check Failed'}
        </div>
      )}
      <button
        className={`btn-map-download ${stage !== 'idle' ? 'downloading' : ''}`}
        onClick={handleDownload}
        disabled={stage !== 'idle'}
      >
        {labels[stage]}
      </button>
    </>
  );
}

interface PublicFeedMapProps {
  records: EvidenceRecord[];
}

export function PublicFeedMap({ records }: PublicFeedMapProps) {
  // A new random key is generated each time this component mounts.
  // This guarantees MapContainer always gets a fresh DOM node, preventing
  // Leaflet's "Map container is already initialized" error that occurs when
  // React 18 re-runs layout effects on reappearing components.
  const [mapKey] = useState(() => `map-${Math.random().toString(36).slice(2)}`);

  const geoRecords = records.filter(
    (r) =>
      r.latitude &&
      r.longitude &&
      !isNaN(parseFloat(r.latitude)) &&
      !isNaN(parseFloat(r.longitude)),
  );

  if (geoRecords.length === 0) return null;

  const positions: [number, number][] = geoRecords.map((r) => [
    parseFloat(r.latitude),
    parseFloat(r.longitude),
  ]);

  // Initial center — average of all points
  const centerLat = positions.reduce((s, p) => s + p[0], 0) / positions.length;
  const centerLng = positions.reduce((s, p) => s + p[1], 0) / positions.length;

  return (
    <div className="feed-map-wrapper">
      <MapContainer
        key={mapKey}
        center={[centerLat, centerLng]}
        zoom={6}
        className="feed-map"
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        />

        <FitBounds positions={positions} />

        {geoRecords.map((r) => {
          const date = new Date(r.timestamp * 1000);
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <Marker key={r.id} position={[parseFloat(r.latitude), parseFloat(r.longitude)]}>
              <Popup minWidth={220} maxWidth={280}>
                <div className="map-popup">
                  <div className="map-popup-id">#{r.id}</div>

                  <div className="map-popup-row">
                    <span className="map-popup-label">📅</span>
                    <span>
                      {formattedDate} {formattedTime}
                    </span>
                  </div>

                  <div className="map-popup-row">
                    <span className="map-popup-label">📍</span>
                    <span>
                      {r.latitude}°N, {r.longitude}°E
                    </span>
                  </div>

                  <div className="map-popup-row">
                    <span className="map-popup-label">🔗</span>
                    <span className="map-popup-cid" title={r.cid}>
                      {r.cid.slice(0, 12)}…{r.cid.slice(-6)}
                    </span>
                  </div>

                  <MapDownloadButton record={r} />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
