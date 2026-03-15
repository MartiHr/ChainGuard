import { useState, useEffect } from 'react';
import type { WalletState } from './types.ts';
import SeedPhraseLogin from './components/seed-phrase-login/index.tsx';
import EvidenceBoard from './components/evidence-board/index.tsx';

export default function App() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      dark ? 'dark' : 'light'
    );
  }, [dark]);

  const toggleTheme = () => setDark((d) => !d);

  const handleLogout = () => {
    setWallet(null);
  };

  if (!wallet) {
    return (
      <SeedPhraseLogin
        onLogin={setWallet}
        dark={dark}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <EvidenceBoard
      wallet={wallet}
      onLogout={handleLogout}
      dark={dark}
      onToggleTheme={toggleTheme}
    />
  );
}
