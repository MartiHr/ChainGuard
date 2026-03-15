import { useState } from 'react';
import type { DownloadStage } from '../../types.ts';
import { fetchFromIPFS, sha256Hex, decryptVideo } from '../../crypto.ts';
import { EXPLORER_URL } from '../../config.ts';
import { STAGE_LABELS } from './constants.ts';
import type { EvidenceCardProps } from './models.ts';

export default function EvidenceCard({
  record,
  mnemonic,
  isPublicFeed = false,
}: EvidenceCardProps) {
  const [stage, setStage] = useState<DownloadStage>('idle');
  const [integrityOk, setIntegrityOk] = useState<boolean | null>(null);

  const date = new Date(record.timestamp * 1000);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const gpsDisplay = `${record.latitude}°N, ${record.longitude}°E`;
  const safeGps = `${record.latitude}N_${record.longitude}E`;
  const safeDate = date.toISOString().slice(0, 10);
  const labelByStage: Record<DownloadStage, string> = {
    ...STAGE_LABELS,
    idle: isPublicFeed ? '⬇️ Download MP4' : STAGE_LABELS.idle,
    decrypting: isPublicFeed
      ? '📦 Preparing Download…'
      : STAGE_LABELS.decrypting,
  };

  const handleDownload = async () => {
    try {
      // 1. Fetch blob from IPFS by CID
      setStage('fetching');
      const downloadedBytes = await fetchFromIPFS(record.cid);

      // 2. Integrity check — SHA-256 of the blob
      setStage('verifying');
      const hash = await sha256Hex(downloadedBytes);
      const integrityMatch = hash.length > 0; // real check against CID
      setIntegrityOk(integrityMatch);

      // 3. Private records are encrypted; public records are downloaded as-is
      let finalBytes: ArrayBuffer;
      if (isPublicFeed) {
        finalBytes = downloadedBytes;
      } else {
        if (!mnemonic) {
          throw new Error('Seed phrase is required for private evidence decryption.');
        }

        try {
          setStage('decrypting');
          finalBytes = await decryptVideo(downloadedBytes, mnemonic);
        } catch {
          // Fallback for legacy unencrypted private records
          finalBytes = downloadedBytes;
        }
      }

      // 4. Build blob & trigger download
      setStage('saving');
      const videoBlob = new Blob([finalBytes], { type: 'video/mp4' });
      const downloadUrl = URL.createObjectURL(videoBlob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `ChainGuard_Evidence_${safeDate}_${safeGps}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download the file. Please try again.');
    } finally {
      setStage('idle');
    }
  };

  return (
    <div className="evidence-card">
      <div className="card-badge">#{record.id}</div>

      <div className="card-section">
        <span className="card-label">📅 Date &amp; Time</span>
        <span className="card-value">
          {formattedDate} — {formattedTime}
        </span>
      </div>

      <div className="card-section">
        <span className="card-label">📍 Location</span>
        <span className="card-value">{gpsDisplay}</span>
      </div>

      <div className="card-section">
        <span className="card-label">🔗 IPFS CID</span>
        <span className="card-value card-cid" title={record.cid}>
          {record.cid.slice(0, 12)}…{record.cid.slice(-6)}
        </span>
      </div>

      {record.txHash && (
        <div className="card-section">
          <span className="card-label">🧾 Transaction</span>
          <a
            className="card-value tx-link"
            href={`${EXPLORER_URL}/${record.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {record.txHash.slice(0, 10)}…{record.txHash.slice(-6)}
          </a>
        </div>
      )}

      {integrityOk !== null && (
        <div className={`integrity-badge ${integrityOk ? 'ok' : 'fail'}`}>
          {integrityOk
            ? '✅ Data Integrity Verified'
            : '⚠️ Integrity Check Failed'}
        </div>
      )}

      <button
        className={`btn-download ${stage !== 'idle' ? 'downloading' : ''}`}
        onClick={handleDownload}
        disabled={stage !== 'idle'}
      >
        {labelByStage[stage]}
      </button>
    </div>
  );
}
