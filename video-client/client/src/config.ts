export const CONTRACT_ABI = [
  {
    type: 'function',
    name: 'storeEvidence',
    inputs: [
      { name: '_cid', type: 'string' },
      { name: '_isPublic', type: 'bool' },
      { name: 'user', type: 'address' },
      { name: '_latitude', type: 'string' },
      { name: '_longitude', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getEvidencesByUser',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'cid', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'isPublic', type: 'bool' },
          { name: 'latitude', type: 'string' },
          { name: 'longitude', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPublicFeed',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'cid', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'isPublic', type: 'bool' },
          { name: 'latitude', type: 'string' },
          { name: 'longitude', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'EvidenceStored',
    inputs: [
      { name: 'cid', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'isPublic', type: 'bool', indexed: false },
      { name: 'latitude', type: 'string', indexed: false },
      { name: 'longitude', type: 'string', indexed: false },
    ],
  },
] as const;

// Configuration - update with your contract deployment details
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
export const RPC_URL = 'http://127.0.0.1:8545';
export const CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
export const RPC_URL = "http://127.0.0.1:8545";
export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs";
export const EXPLORER_URL = "http://localhost:8545";
