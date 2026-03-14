import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import { assembleVideo } from "./services/assembler";
import { encryptVideo } from "./services/encryption";
import { uploadToIPFS } from "./services/ipfs";
import {
  initContract,
  submitEvidence,
  getEvidencesByUser,
  getPublicEvidences,
} from "./services/blockchain";

const app = express();
app.use(cors());
app.use(express.json());

interface Session {
  walletAddress: string;
  publicKey: string;
  isPublic: boolean;
  gpsCoordinates: string;
  chunkCount: number;
  dir: string;
  timeoutId?: NodeJS.Timeout;
}

const sessions = new Map<string, Session>();

async function finalizeSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return; 

  console.log(`[Auto-Finalize] Session ${sessionId} processing...`);

  try {
    const assembledPath = path.join(session.dir, "final.mp4");
    await assembleVideo(session.dir, assembledPath);

    let fileToUpload: Buffer;
    if (!session.isPublic) {
      fileToUpload = await encryptVideo(assembledPath, session.publicKey);
    } else {
      fileToUpload = await fs.readFile(assembledPath);
    }

    const fileName = session.isPublic ? "evidence.mp4" : "evidence.enc";
    const cid = await uploadToIPFS(fileToUpload, fileName);

    await submitEvidence(cid, session.gpsCoordinates, session.isPublic, session.walletAddress);
    console.log(`[Success] Evidence saved for session ${sessionId}`);
  } catch (error) {
    console.error(`[Error] Finalization failed for ${sessionId}:`, error);
  } finally {
    await fs.rm(session.dir, { recursive: true, force: true }).catch(() => {});
    sessions.delete(sessionId);
  }
}

// --- Start session ---
app.post("/sessions", async (req, res) => {
  try {
    const { walletAddress, publicKey, isPublic, gpsCoordinates } = req.body;
    const sessionId = uuidv4();
    const dir = path.join(__dirname, "../uploads", sessionId);
    await fs.mkdir(dir, { recursive: true });

    const timeoutId = setTimeout(() => {
      console.log(`Session ${sessionId} timed out! Auto-finalizing...`);
      finalizeSession(sessionId);
    }, 20000);

    sessions.set(sessionId, {
      walletAddress,
      publicKey,
      isPublic,
      gpsCoordinates,
      chunkCount: 0,
      dir,
      timeoutId
    });

    res.json({ sessionId });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
});

// --- Receive chunk ---
const upload = multer({ dest: "uploads/tmp/" });

app.post(
  "/sessions/:sessionId/chunks",
  upload.single("chunk"),
  async (req, res) => {
    try {
      const sessionId = req.params.sessionId as string;
      const session = sessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      if (session.timeoutId) clearTimeout(session.timeoutId);

      const chunkIndex = session.chunkCount;
      const destPath = path.join(
        session.dir,
        `chunk_${String(chunkIndex).padStart(5, "0")}.mp4`,
      );
      await fs.rename(req.file!.path, destPath);

      if (req.body.gpsCoordinates) {
        session.gpsCoordinates = req.body.gpsCoordinates;
      }

      session.chunkCount++;

      session.timeoutId = setTimeout(() => {
      console.log(`Session ${sessionId} timed out after chunk ${chunkIndex}! Auto-finalizing...`);
      finalizeSession(sessionId);
      }, 20000);

      console.log(`Session ${sessionId}: received chunk ${chunkIndex}`);
      res.json({ received: true, chunkIndex });
    } catch (error) {
      console.error("Error receiving chunk:", error);
      res.status(500).json({ error: "Failed to receive chunk" });
    }
  },
);

// --- End session (triggers finalization) ---
app.post("/sessions/:sessionId/end", async (req, res) => {
  try {
    const sessionId = req.params.sessionId as string;
    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.timeoutId) clearTimeout(session.timeoutId);

    finalizeSession(sessionId);

    
    console.log(
      `Session ${sessionId}: finalizing (${session.chunkCount} chunks)...`,
    );

    // 1. Assemble chunks into single video
    const assembledPath = path.join(session.dir, "final.mp4");
    await assembleVideo(session.dir, assembledPath);
    console.log("  Video assembled.");

    // 2. Encrypt if private
    let fileToUpload: Buffer;
    if (!session.isPublic) {
      fileToUpload = await encryptVideo(assembledPath, session.publicKey);
      console.log("  Video encrypted.");
    } else {
      fileToUpload = await fs.readFile(assembledPath);
    }

    // 3. Upload to IPFS
    const fileName = session.isPublic ? "evidence.mp4" : "evidence.enc";
    const cid = await uploadToIPFS(fileToUpload, fileName);
    console.log(`  Uploaded to IPFS: ${cid}`);

    // 4. Submit to blockchain
    const transactionHash = await submitEvidence(
      cid,
      session.gpsCoordinates,
      session.isPublic,
      session.walletAddress,
    );
    console.log(`  Submitted to blockchain: ${transactionHash}`);

    // 5. Cleanup
    await fs.rm(session.dir, { recursive: true });
    sessions.delete(req.params.sessionId);

    res.json({ cid, transactionHash });
  } catch (error) {
    console.error("Error finalizing session:", error);
    res.status(500).json({ error: "Failed to finalize session" });
  }
});

// --- Query evidence (public must be before :walletAddress to avoid matching "public" as an address) ---
app.get("/evidence/public", async (_req, res) => {
  try {
    const evidence = await getPublicEvidences();
    res.json(evidence);
  } catch (error) {
    console.error("Error fetching public evidence:", error);
    res.status(500).json({ error: "Failed to fetch public evidence" });
  }
});

app.get("/evidence/:walletAddress", async (req, res) => {
  try {
    const evidence = await getEvidencesByUser(
      req.params.walletAddress as string,
    );
    res.json(evidence);
  } catch (error) {
    console.error("Error fetching evidence:", error);
    res.status(500).json({ error: "Failed to fetch evidence" });
  }
});

// const PORT = process.env.PORT || 3000;

// Initialize blockchain connection
initContract()
  .then(() => {
    console.log("Connected to local blockchain");
  })
  .catch((error: any) => {
    console.error("Failed to connect to blockchain:", error);
  });

// app.listen(PORT,  () => {
//   console.log(`ChainGuard backend running on :${PORT}`);
// });

// Force PORT to be a number

const PORT: number = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ChainGuard backend running on port: ${PORT}`);
  // Replace <YOUR_IPV4_ADDRESS> with the IP from ipconfig (e.g., 192.168.1.15)
  console.log(`Mobile app should connect to: http://YOUR_IP_HERE:${PORT}`);
});