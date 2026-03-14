import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

export async function uploadToIPFS(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  const file = new File([new Uint8Array(fileBuffer)], fileName, {
    type: fileName.endsWith(".mp4") ? "video/mp4" : "application/octet-stream",
  });
  const result = await pinata.upload.file(file);
  return result.cid;
}

export async function downloadFromIPFS(cid: string): Promise<Buffer> {
  const response = await pinata.gateways.get(cid);
  const blob = response.data as Blob;
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
