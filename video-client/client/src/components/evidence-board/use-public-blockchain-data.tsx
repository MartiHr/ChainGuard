import { useEffect, useState } from 'react';
import type { EvidenceRecord } from '../../types';
import { fetchPublicRecords } from '../../blockchain';

export function usePublicBlockchainData() {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchPublicRecords();
        if (!cancelled) {
          setRecords(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.log(error);
          setError('Could not load the public feed from the smart contract.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { records, loading, error };
}
