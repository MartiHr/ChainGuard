import EvidenceCard from '../evidence-card/index.tsx';
import { Header } from './header/index.tsx';
import type { EvidenceBoardProps } from './models.ts';
import { StatsBar } from './start-bar/index.tsx';
import { useBlockchainData } from './use-blockchain-data.tsx';
import { usePublicBlockchainData } from './use-public-blockchain-data.tsx';

export default function EvidenceBoard({
  wallet,
  onLogout,
  dark,
  onToggleTheme,
}: EvidenceBoardProps) {
  const {
    records: privateRecords,
    loading: privateLoading,
    error: privateError,
  } = useBlockchainData(wallet);
  const {
    records: publicRecords,
    loading: publicLoading,
    error: publicError,
  } = usePublicBlockchainData();

  return (
    <div className="dashboard">
      <Header
        wallet={wallet}
        onLogout={onLogout}
        dark={dark}
        onToggleTheme={onToggleTheme}
      />

      <StatsBar records={privateRecords} />

      {/* Notices */}
      {privateError && <div className="notice notice-warn">{privateError}</div>}
      {publicError && <div className="notice notice-warn">{publicError}</div>}

      {/* Private content */}
      <section className="board-section">
        <div className="section-header">
          <h2>My Evidence</h2>
          <p>Private and owner-linked records for this wallet.</p>
        </div>

        {privateLoading ? (
          <div className="loader">
            <div className="spinner" />
            <p>Querying your wallet evidence…</p>
          </div>
        ) : privateRecords.length === 0 ? (
          <div className="empty-state">
            <p>No evidence records found for this wallet.</p>
          </div>
        ) : (
          <div className="evidence-grid">
            {privateRecords.map((r) => (
              <EvidenceCard key={`private-${r.id}`} record={r} mnemonic={wallet.mnemonic} />
            ))}
          </div>
        )}
      </section>

      {/* Public content */}
      <section className="board-section">
        <div className="section-header">
          <h2>Public Video Feed</h2>
          <p>Community shared videos pulled directly from on-chain public CIDs.</p>
        </div>

        {publicLoading ? (
          <div className="loader">
            <div className="spinner" />
            <p>Loading public feed…</p>
          </div>
        ) : publicRecords.length === 0 ? (
          <div className="empty-state">
            <p>No public videos available yet.</p>
          </div>
        ) : (
          <div className="evidence-grid">
            {publicRecords.map((r) => (
              <EvidenceCard key={`public-${r.id}`} record={r} isPublicFeed />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
