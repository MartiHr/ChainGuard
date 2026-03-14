import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner();

  // Get contract ABI and bytecode from artifacts
  const contractPath = path.join(__dirname, "../artifacts/contracts/ChainGuard.sol/ChainGuard.json");
  const artifact = JSON.parse(fs.readFileSync(contractPath, "utf-8"));
  
  const Contract = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const chainGuard = await Contract.deploy();

  // Wait for deployment
  const deploymentTx = await chainGuard.deploymentTransaction();
  if (deploymentTx) {
    await deploymentTx.wait();
  }

  const address = await chainGuard.getAddress();
  console.log("✓ ChainGuard deployed to:", address);

  // Test 1: Store evidence
  console.log("\n=== Testing Contract Functions ===\n");
  console.log("Test 1: Store evidence with location data");
  const cid = "QmahdJBPpwwheQMvKHnJEgs1NvnsFccxfPvcRUt9uKBsnk";
  const latitude = "42.6977";
  const longitude = "23.3219";
  
  try {
    const tx = await chainGuard.storeEvidence(cid, true, await signer.getAddress(), latitude, longitude);
    await tx.wait();
    console.log("  ✓ Evidence stored successfully");
  } catch (error) {
    console.log("  ✗ Error storing evidence:", error.message);
  }

  // Test 2: Retrieve user evidence
  console.log("\nTest 2: Retrieve evidence by user address");
  try {
    const userAddress = await signer.getAddress();
    const evidences = await chainGuard.getEvidencesByUser(userAddress);
    console.log("  ✓ Retrieved " + evidences.length + " evidence(s)");
    if (evidences.length > 0) {
      const evidence = evidences[0];
      console.log("    - CID:", evidence.cid);
      console.log("    - Location:", evidence.latitude + "," + evidence.longitude);
      console.log("    - Public:", evidence.isPublic);
      console.log("    - Timestamp:", new Date(Number(evidence.timestamp) * 1000).toISOString());
    }
  } catch (error) {
    console.log("  ✗ Error retrieving evidence:", error.message);
  }

  // Test 3: Get public feed
  console.log("\nTest 3: Retrieve public evidence feed");
  try {
    const publicFeed = await chainGuard.getPublicFeed();
    console.log("  ✓ Retrieved " + publicFeed.length + " public evidence(s)");
  } catch (error) {
    console.log("  ✗ Error retrieving public feed:", error.message);
  }

  // Test 4: Try to store duplicate
  console.log("\nTest 4: Prevent duplicate evidence");
  try {
    const tx = await chainGuard.storeEvidence(cid, true, await signer.getAddress(), latitude, longitude);
    await tx.wait();
    console.log("  ✗ Duplicate evidence was stored (should have been prevented)");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("  ✓ Duplicate correctly prevented");
    } else {
      console.log("  ✗ Unexpected error:", error.message);
    }
  }

  // Save address to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "localhost.json");
  fs.writeFileSync(deploymentFile, JSON.stringify({ ChainGuard: address }, null, 2));

  console.log("\n✓ Deployment saved to:", deploymentFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
