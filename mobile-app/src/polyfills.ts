import { Buffer } from "buffer";
import { getRandomValues } from "expo-crypto";

(global as any).Buffer = (global as any).Buffer || Buffer;

if (typeof globalThis.crypto === "undefined") {
  (globalThis as any).crypto = {};
}
if (typeof globalThis.crypto.getRandomValues !== "function") {
  globalThis.crypto.getRandomValues = getRandomValues as any;
}
