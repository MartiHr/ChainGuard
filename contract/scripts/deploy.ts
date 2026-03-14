import { artifacts } from "hardhat";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner(0);
const artifact = await artifacts.readArtifact("ChainGuard");
const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
const contract = await factory.deploy();
await contract.waitForDeployment();
const address = await contract.getAddress();
console.log(`ChainGuard deployed to: ${address}`);
