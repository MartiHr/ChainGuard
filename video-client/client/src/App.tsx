import { useState } from "react";
import type { WalletState } from "./types.ts";
import SeedPhraseLogin from "./components/SeedPhraseLogin.tsx";
import EvidenceBoard from "./components/EvidenceBoard.tsx";

export default function App() {
  const [wallet, setWallet] = useState<WalletState | null>(null);

  const handleLogout = () => {
    setWallet(null); // wipes private key from memory
  };

  if (!wallet) {
    return <SeedPhraseLogin onLogin={setWallet} />;
  }

  return <EvidenceBoard wallet={wallet} onLogout={handleLogout} />;
}
