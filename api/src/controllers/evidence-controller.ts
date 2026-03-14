import { Request, Response } from "express";
import { getEvidencesByUser, getPublicEvidences } from "../services/blockchain";

export async function getPublic(req: Request, res: Response) {
  try {
    const evidence = await getPublicEvidences();
    res.json(evidence);
  } catch (error) {
    console.error("Error fetching public evidence:", error);
    res.status(500).json({ error: "Failed to fetch public evidence" });
  }
}

export async function getByWallet(req: Request, res: Response) {
  try {
    const walletAddress = req.params.walletAddress as string;

    const evidence = await getEvidencesByUser(walletAddress);

    res.json(evidence);
  } catch (error) {
    console.error("Error fetching evidence:", error);
    res.status(500).json({ error: "Failed to fetch evidence" });
  }
}
