import type { StatBarProps } from './models';

export function StatsBar({ records }: StatBarProps) {
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-number">{records.length}</span>
        <span className="stat-label">Evidence Records</span>
      </div>
      <div className="stat">
        <span className="stat-number">
          {records.length > 0
            ? new Date(
                Math.max(...records.map((r) => r.timestamp)) * 1000
              ).toLocaleDateString()
            : '—'}
        </span>
        <span className="stat-label">Latest Capture</span>
      </div>
      <div className="stat">
        <span className="stat-number status-secured">● Secured</span>
        <span className="stat-label">Chain Status</span>
      </div>
    </div>
  );
}
