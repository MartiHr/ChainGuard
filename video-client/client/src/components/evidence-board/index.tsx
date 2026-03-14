import EvidenceCard from '../evidence-card/index.tsx';
import { Header } from './header/index.tsx';
import type { EvidenceBoardProps } from './models.ts';
import { StatsBar } from './start-bar/index.tsx';
import { useBlockchainData } from './use-blockchain-data.tsx';

export default function EvidenceBoard({
  wallet,
  onLogout,
  dark,
  onToggleTheme,
}: EvidenceBoardProps) {
  const { records, loading, error } = useBlockchainData(wallet);

  return (
    <div className="dashboard">
      <Header
        wallet={wallet}
        onLogout={onLogout}
        dark={dark}
        onToggleTheme={onToggleTheme}
      />

      <StatsBar records={records} />

      {/* Notices */}
      {error && <div className="notice notice-warn">{error}</div>}

      {/* Content */}
      {loading ? (
        <div className="loader">
          <div className="spinner" />
          <p>Querying blockchain…</p>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <p>No evidence records found for this wallet.</p>
        </div>
      ) : (
        <div className="evidence-grid">
          {records.map((r) => (
            <EvidenceCard key={r.id} record={r} mnemonic={wallet.mnemonic} />
          ))}
        </div>
      )}
    </div>
  );
}
