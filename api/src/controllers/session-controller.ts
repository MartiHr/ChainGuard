import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

import { assembleVideo } from "../services/assembler";
import { encryptVideo } from "../services/encryption";
import { uploadToIPFS } from "../services/ipfs";
import { submitEvidence } from "../services/blockchain";

import {
  createSession,
  getSession,
  deleteSession,
} from "../storage/session-storage";

export async function startSession(req: Request, res: Response) {
  try {
    const { walletAddress, publicKey, isPublic, gpsCoordinates } = req.body;

    const sessionId = uuidv4();
    const dir = path.join(__dirname, "../../uploads", sessionId);

    await fs.mkdir(dir, { recursive: true });

    createSession(sessionId, {
      walletAddress,
      publicKey,
      isPublic,
      gpsCoordinates,
      chunkCount: 0,
      dir,
    });

    res.json({ sessionId });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
}

export async function uploadChunk(req: Request, res: Response) {
  try {
    const sessionId = req.params.sessionId as string;

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Chunk file missing" });
    }

    const chunkIndex = session.chunkCount;

    const destPath = path.join(
      session.dir,
      `chunk_${String(chunkIndex).padStart(5, "0")}.mp4`,
    );

    await fs.rename(req.file.path, destPath);

    if (req.body.gpsCoordinates) {
      session.gpsCoordinates = req.body.gpsCoordinates;
    }

    session.chunkCount++;

    console.log(`Session ${sessionId}: received chunk ${chunkIndex}`);

    res.json({
      received: true,
      chunkIndex,
    });
  } catch (error) {
    console.error("Error receiving chunk:", error);
    res.status(500).json({ error: "Failed to receive chunk" });
  }
}

export async function endSession(req: Request, res: Response) {
  try {
    const sessionId = req.params.sessionId as string;

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    console.log(
      `Session ${sessionId}: finalizing (${session.chunkCount} chunks)...`,
    );

    const assembledPath = path.join(session.dir, "final.mp4");

    // 1️⃣ Assemble chunks into video
    await assembleVideo(session.dir, assembledPath);

    console.log("Video assembled");

    // 2️⃣ Encrypt if private
    let fileBuffer: Buffer;

    if (!session.isPublic) {
      fileBuffer = await encryptVideo(assembledPath, session.publicKey);
      console.log("Video encrypted");
    } else {
      fileBuffer = await fs.readFile(assembledPath);
    }

    // 3️⃣ Upload to IPFS
    const fileName = session.isPublic ? "evidence.mp4" : "evidence.enc";

    const cid = await uploadToIPFS(fileBuffer, fileName);

    console.log(`Uploaded to IPFS: ${cid}`);

    // 4️⃣ Submit proof to blockchain
    const transactionHash = await submitEvidence(
      cid,
      session.gpsCoordinates,
      session.isPublic,
      session.walletAddress,
    );

    console.log(`Submitted to blockchain: ${transactionHash}`);

    // 5️⃣ Cleanup
    await fs.rm(session.dir, { recursive: true, force: true });

    deleteSession(sessionId);

    res.json({
      cid,
      transactionHash,
    });
  } catch (error) {
    console.error("Error finalizing session:", error);
    res.status(500).json({ error: "Failed to finalize session" });
  }
}
