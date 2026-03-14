import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner();
const signerAddress = await signer.getAddress();

const artifact = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      "../artifacts/contracts/ChainGuard.sol/ChainGuard.json",
    ),
    "utf-8",
  ),
);

const deployment = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../deployments/localhost.json"),
    "utf-8",
  ),
);

const contract = new ethers.Contract(
  deployment.ChainGuard,
  artifact.abi,
  signer,
);

// ── Test records to seed ────────────────────────────────────
const records = [
  {
    cid: "bafybeifwhxzh4abl3d2y2xyubexo3haxypxk2dlhcxukgl2oyyeg4hfb24",
    isPublic: true,
    latitude: "42.6977",
    longitude: "23.3219",
  },
  {
    cid: "bafybeicq64apw4kraynklvjrfdrxhj4e5qg7gsis4o7lq3ndsaybcaekaa",
    isPublic: true,
    latitude: "42.1354",
    longitude: "24.7453",
  },
  {
    cid: "bafybeidbljsnjpuoxi2fdgy24qm5ndudxzb2i5mardze5ebn45ilglfwum",
    isPublic: false,
    latitude: "43.2141",
    longitude: "27.9147",
  },
  {
    cid: "bafybeih2v5p2kbr4o4zu6j2m3qvhtswm4d7x6pkm6x3n7kh3f4n7tghqja",
    isPublic: true,
    latitude: "42.5048",
    longitude: "27.4626",
  },
  {
    cid: "bafybeie6h2jv5uap4nmwmz7w5sfrwzv3z3l6k4r2i4twq6k34xlgdtm6xa",
    isPublic: false,
    latitude: "43.8356",
    longitude: "25.9657",
  },
  {
    cid: "bafybeihwpfkqj4jmvj6i4n3f3ql5ih66t2noz7xvkmxv2b6n4p72v54x5e",
    isPublic: true,
    latitude: "42.4258",
    longitude: "25.6345",
  },
  {
    cid: "bafybeidqj4w3d2bxhj6n3rx5u7h6xph7rr2r4j4w2lxzlbj7x6x6dk7v5y",
    isPublic: true,
    latitude: "41.9973",
    longitude: "23.4923",
  },
  {
    cid: "bafybeib5x4x2d2cgyv5f4u6kvqgsh3hq5ggq4im2cv2d2yxh7d6t4mf4xq",
    isPublic: false,
    latitude: "43.0757",
    longitude: "25.6172",
  },
  {
    cid: "bafybeig2e5f7h7m4a3b2f8r9q1v6k3h5x5l6u3r6m7n2q4f8z5k6n3x4ya",
    isPublic: true,
    latitude: "42.7339",
    longitude: "25.4858",
  },
  {
    cid: "bafybeia2b4j7m8n9p2d5g6h7k8l9m2q3w4e5r6t7y8u9i0o1p2a3s4d5f",
    isPublic: false,
    latitude: "43.4170",
    longitude: "23.2378",
  },
  {
    cid: "bafybeib9m3c2x7v5n4z1q8w6e3r2t9y5u1i7o4p6a8s3d2f5g7h9j1k2l",
    isPublic: true,
    latitude: "42.6500",
    longitude: "26.3667",
  },
  {
    cid: "bafybeic4n8m2q1w7e6r5t4y3u2i1o9p8a7s6d5f4g3h2j1k9l8z7x6c5v",
    isPublic: true,
    latitude: "42.2667",
    longitude: "23.1167",
  },
  {
    cid: "bafybeid7s3a5d9f2g4h6j8k1l3z5x7c9v2b4n6m8q1w3e5r7t9y2u4i6o",
    isPublic: false,
    latitude: "41.6500",
    longitude: "25.3667",
  },
];

// Default: your recovery-key wallet. Override via CLI: node scripts/seed.js 0xOther
const targetUser =
  process.argv[2] || "0x369C2B5961C89F56B1F2b798595BaBcd1c3A4c94";

console.log(
  `Seeding ${records.length} evidence records for ${targetUser}...\n`,
);

for (const r of records) {
  try {
    const tx = await contract.storeEvidence(
      r.cid,
      r.isPublic,
      targetUser,
      r.latitude,
      r.longitude,
    );
    await tx.wait();
    console.log(`  ✓ Stored ${r.cid.slice(0, 20)}… (public: ${r.isPublic})`);
  } catch (err) {
    console.log(`  ✗ ${r.cid.slice(0, 20)}… — ${err.message}`);
  }
}

console.log("\nDone. You can now fetch these from the video client.");
