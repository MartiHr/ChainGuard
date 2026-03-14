import type { DownloadStage } from '../../types';

export const STAGE_LABELS: Record<DownloadStage, string> = {
  idle: '⬇️ Decrypt & Download MP4',
  fetching: '📡 Fetching from IPFS…',
  verifying: '🔍 Verifying Integrity…',
  decrypting: '🔓 Decrypting Locally…',
  saving: '💾 Saving to Disk…',
};
