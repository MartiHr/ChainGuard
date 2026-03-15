import type { EvidenceRecord } from '../../types';

export interface EvidenceCardProps {
  record: EvidenceRecord;
  mnemonic?: string;
  isPublicFeed?: boolean;
}
