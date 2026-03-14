import express from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { ethers } from 'ethers';
import pinataSDK from '@pinata/sdk';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnv = ['PINATA_JWT', 'RPC_URL', 'PRIVATE_KEY', 'CONTRACT_ADDRESS'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} is required`);
  }
}

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// 1. Инициализация на Pinata
const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

// 2. Блокчейн настройки
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

// Вземане на ABI
const abiPath = path.join(__dirname, '../abis/ChainGuard.json');
if (!fs.existsSync(abiPath)) {
  throw new Error(`ABI file not found: ${abiPath}`);
}
const contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;

const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS as string,
    contractABI,
    wallet
);

// Ендпоинт за качване
app.post('/upload', upload.single('video'), async (req: any, res: any) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No video file provided" });

        console.log("🚀 Starting upload process...");

        // А. Качване в IPFS чрез Pinata
        const readableStreamForFile = fs.createReadStream(req.file.path);
        const options = {
            pinataMetadata: { name: `ChainGuard_${Date.now()}` },
            pinataOptions: { cidVersion: 0 as const }
        };

        const pinataResponse = await pinata.pinFileToIPFS(readableStreamForFile, options);
        const cid = pinataResponse.IpfsHash;
        console.log("📦 IPFS CID:", cid);

        // Б. Запис в Блокчейна (Hardhat Local)
        console.log("⛓️ Recording to Blockchain...");
        const isPublic = true;
        const tx = await contract.storeEvidence(cid, isPublic);
        const receipt = await tx.wait();

        // Почистване на локалния файл
        fs.unlinkSync(req.file.path);

        return res.json({
            success: true,
            cid: cid,
            transactionHash: receipt.hash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}`
        });

    } catch (error: any) {
        console.error("❌ Error:", error);
        return res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Relay API is running on http://localhost:${PORT}`);
    console.log(`🔗 Connected to Contract: ${process.env.CONTRACT_ADDRESS}`);
});