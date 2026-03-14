const { ethers } = require("hardhat");

async function main() {
  const ChainGuard = await ethers.getContractFactory("ChainGuard");
  const chainGuard = await ChainGuard.deploy();

  await chainGuard.waitForDeployment();

  console.log("ChainGuard deployed to:", await chainGuard.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
