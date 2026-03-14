export const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "getRecordsByOwner",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "cid", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "string", name: "latitude", type: "string" },
          { internalType: "string", name: "longitude", type: "string" },
          { internalType: "address", name: "owner", type: "address" },
        ],
        internalType: "struct ChainGuard.Record[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRecordCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Dummy config
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
export const RPC_URL = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY";
export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs";
export const EXPLORER_URL = "https://sepolia.etherscan.io/tx";
