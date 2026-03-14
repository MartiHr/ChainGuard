import { useEffect, useState } from 'react';
import type { EvidenceRecord, WalletState } from '../../types';
import { fetchRecords } from '../../blockchain';

export function useBlockchainData(wallet: WalletState) {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchRecords(wallet.address);
        if (!cancelled) {
          setRecords(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.log(error);
          setError('Could not reach the smart contract.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [wallet.address]);

  return { records, loading, error };
}
