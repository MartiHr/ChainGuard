import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner();

  const ChainGuard = new ethers.ContractFactory(
    // ABI and bytecode would be needed, but for deployment, use hardhat
  );
  // Better to use hardhat's way
}
