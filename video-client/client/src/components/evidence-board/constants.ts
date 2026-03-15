import type { EvidenceRecord } from '../../types';

// Demonstration records used when the contract is not yet deployed
export const DEMO_RECORDS: EvidenceRecord[] = [
  {
    id: 1,
    cid: 'bafybeifwhxzh4abl3d2y2xyubexo3haxypxk2dlhcxukgl2oyyeg4hfb24',
    timestamp: Math.floor(new Date('2026-03-14T14:30:00Z').getTime() / 1000),
    latitude: '42.6977',
    longitude: '23.3219',
    txHash:
      '0xabc123def456789012345678901234567890abcdef1234567890abcdef123456',
    owner: '0x0000000000000000000000000000000000000000',
    isPublic: true,
  },
  {
    id: 2,
    cid: 'bafybeicq64apw4kraynklvjrfdrxhj4e5qg7gsis4o7lq3ndsaybcaekaa',
    timestamp: Math.floor(new Date('2026-03-13T09:15:00Z').getTime() / 1000),
    latitude: '42.1354',
    longitude: '24.7453',
    txHash:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    owner: '0x0000000000000000000000000000000000000000',
    isPublic: true,
  },
  {
    id: 3,
    cid: 'bafybeidbljsnjpuoxi2fdgy24qm5ndudxzb2i5mardze5ebn45ilglfwum',
    timestamp: Math.floor(new Date('2026-03-12T18:45:00Z').getTime() / 1000),
    latitude: '43.2141',
    longitude: '27.9147',
    txHash:
      '0x789012345678901234567890abcdef1234567890abcdef1234567890abcdef12',
    owner: '0x0000000000000000000000000000000000000000',
    isPublic: true,
  },
  {
    id: 4,
    cid: 'bafybeia6cvbdfu6m5wpy5cljc75og6yeshmcdvd43sl4aog3d4bl2fyyiq',
    timestamp: Math.floor(new Date('2026-03-12T18:45:00Z').getTime() / 1000),
    latitude: '43.2141',
    longitude: '27.9147',
    txHash:
      '0x789012345678901234567890abcdef1234567890abcdef1234567890abcdef12',
    owner: '0x0000000000000000000000000000000000000000',
    isPublic: true,
  },
];
