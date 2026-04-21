import React from 'react';
import { Network } from 'lucide-react';

interface Props {
  network: 'mainnet' | 'testnet' | 'devnet';
  setNetwork: React.Dispatch<React.SetStateAction<'mainnet' | 'testnet' | 'devnet'>>;
}

export function NetworkSelector({ network, setNetwork }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Network size={16} className="text-neutral-500" />
      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value as any)}
        className="bg-neutral-100 border-none rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-neutral-700"
      >
        <option value="mainnet">Mainnet</option>
        <option value="testnet">Testnet</option>
        <option value="devnet">Devnet</option>
      </select>
    </div>
  );
}
