import { useEffect, useState } from 'react';
import type { EvidenceRecord, WalletState } from '../../types';
import { fetchRecords } from '../../blockchain';
import { DEMO_RECORDS } from './constants';

export function useBlockchainData(wallet: WalletState) {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [useDemoData, setUseDemoData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchRecords(wallet.address);
        if (!cancelled) {
          setRecords(data);
          setUseDemoData(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.log(error);
          // Fallback to demo data when contract is unreachable
          setRecords(DEMO_RECORDS);
          setUseDemoData(true);
          setError(
            'Could not reach the smart contract — showing demo records.'
          );
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

  return { records, loading, error, useDemoData };
}
