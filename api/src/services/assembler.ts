import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function assembleVideo(
  chunkDir: string,
  outputPath: string,
): Promise<void> {
  // List all chunk files in order
  const files = (await fs.readdir(chunkDir))
    .filter((f) => f.startsWith("chunk_"))
    .sort();

  if (files.length === 0) {
    throw new Error("No chunks found in directory");
  }

  // Create ffmpeg concat file
  const concatFilePath = path.join(chunkDir, "chunks.txt");
  const concatContent = files
    .map((f) => `file '${path.join(chunkDir, f)}'`)
    .join("\n");
  await fs.writeFile(concatFilePath, concatContent);

  // Concatenate with ffmpeg
  await execAsync(
    `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c:v copy -c:a aac "${outputPath}"`,
  );
}
