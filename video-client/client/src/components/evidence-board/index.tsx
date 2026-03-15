import { Component, type ReactNode } from 'react';
import EvidenceCard from '../evidence-card/index.tsx';
import { PublicFeedMap } from '../public-feed-map/index.tsx';
import { Header } from './header/index.tsx';
import type { EvidenceBoardProps } from './models.ts';
import { StatsBar } from './start-bar/index.tsx';
import { useBlockchainData } from './use-blockchain-data.tsx';
import { usePublicBlockchainData } from './use-public-blockchain-data.tsx';

// Prevents a map initialisation error from unmounting the whole app
class MapErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="notice notice-warn" style={{ margin: '0 2rem 1rem' }}>
          🗺️ Map could not be loaded: {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

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
          <>
            <div className="section-map-label">
              <span>🗺️ Geolocation Map</span>
              <span className="section-map-hint">Click a pin to view details and download</span>
            </div>
            <MapErrorBoundary>
              <PublicFeedMap records={publicRecords} />
            </MapErrorBoundary>

            <div className="section-subheader">
              <span>📋 All Records</span>
            </div>
            <div className="evidence-grid">
              {publicRecords.map((r) => (
                <EvidenceCard key={`public-${r.id}`} record={r} isPublicFeed />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
