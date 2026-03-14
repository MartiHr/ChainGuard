import { useEffect, useState } from "react";
import type { WalletState, EvidenceRecord } from "../types.ts";
import { fetchRecords } from "../blockchain.ts";
import EvidenceCard from "./EvidenceCard.tsx";
import ThemeToggle from "./ThemeToggle.tsx";
import chainGuardLogo from "../assets/ChainGuard.png";

interface Props {
  wallet: WalletState;
  onLogout: () => void;
  dark: boolean;
  onToggleTheme: () => void;
}

// Demonstration records used when the contract is not yet deployed
const DEMO_RECORDS: EvidenceRecord[] = [
  {
    id: 1,
    cid: "QmahdJBPpwwheQMvKHnJEgs1NvnsFccxfPvcRUt9uKBsnk",
    timestamp: Math.floor(new Date("2026-03-14T14:30:00Z").getTime() / 1000),
    latitude: "42.6977",
    longitude: "23.3219",
    txHash:
      "0xabc123def456789012345678901234567890abcdef1234567890abcdef123456",
    owner: "0x0000000000000000000000000000000000000000",
  },
  {
    id: 2,
    cid: "bafybeidiop2nneprrfv55trwka7y2wljlbqtyg53h4hoytoetggxz7uidi",
    timestamp: Math.floor(new Date("2026-03-13T09:15:00Z").getTime() / 1000),
    latitude: "42.1354",
    longitude: "24.7453",
    txHash:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    owner: "0x0000000000000000000000000000000000000000",
  },
  {
    id: 3,
    cid: "bafybeidbljsnjpuoxi2fdgy24qm5ndudxzb2i5mardze5ebn45ilglfwum",
    timestamp: Math.floor(new Date("2026-03-12T18:45:00Z").getTime() / 1000),
    latitude: "43.2141",
    longitude: "27.9147",
    txHash:
      "0x789012345678901234567890abcdef1234567890abcdef1234567890abcdef12",
    owner: "0x0000000000000000000000000000000000000000",
  },
];

export default function EvidenceBoard({ wallet, onLogout, dark, onToggleTheme }: Props) {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [useDemoData, setUseDemoData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchRecords(wallet.address);
        if (!cancelled) {
          setRecords(data);
          setUseDemoData(false);
        }
      } catch {
        if (!cancelled) {
          // Fallback to demo data when contract is unreachable
          setRecords(DEMO_RECORDS);
          setUseDemoData(true);
          setError(
            "Could not reach the smart contract — showing demo records.",
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

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <span className="logo">
            ChainGuard
          </span>
          <span className="header-divider">|</span>
          <span className="header-subtitle">Evidence Dashboard</span>
        </div>
        <div className="header-right">
          <span className="wallet-address" title={wallet.address}>
            {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
          </span>
          <button className="btn-logout" onClick={onLogout}>
            Lock &amp; Logout
          </button>
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        </div>
      </header>

      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-number">{records.length}</span>
          <span className="stat-label">Evidence Records</span>
        </div>
        <div className="stat">
          <span className="stat-number">
            {records.length > 0
              ? new Date(
                  Math.max(...records.map((r) => r.timestamp)) * 1000,
                ).toLocaleDateString()
              : "—"}
          </span>
          <span className="stat-label">Latest Capture</span>
        </div>
        <div className="stat">
          <span className="stat-number status-secured">● Secured</span>
          <span className="stat-label">Chain Status</span>
        </div>
      </div>

      {/* Notices */}
      {error && (
        <div className="notice notice-warn">
          {error}
        </div>
      )}
      {useDemoData && (
        <div className="notice notice-info">
          ℹ️ These are placeholder records. Connect to a deployed contract to
          see real evidence.
        </div>
      )}

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
            <EvidenceCard
              key={r.id}
              record={r}
              privateKey={wallet.privateKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}
