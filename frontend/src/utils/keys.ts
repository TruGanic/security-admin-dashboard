import { Buffer } from "buffer";
import { ec as EC } from "elliptic";

const ec = new EC("secp256k1");
const DID_BASE = "did:web:truganic.github.io:did-documents";

export type DidDocumentType = "client" | "server" | "core";

/** Result of key pair generation only (no DID yet). */
export interface KeyPairOnly {
  privateKeyHex: string;
  publicKeyX: string;
  publicKeyY: string;
}

/** Full result with DID document (for publish). */
export interface KeyPairResult {
  privateKeyHex: string;
  publicKeyX: string;
  publicKeyY: string;
  did: string;
  didDocument: Record<string, unknown>;
  type: DidDocumentType;
  id: string;
}

function buildDid(type: DidDocumentType, id: string): string {
  if (type === "core") return `${DID_BASE}:core`;
  const segment = type === "client" ? "clients" : "servers";
  return `${DID_BASE}:${segment}:${id}`;
}

/** Base64url for JWK (same as demo-client-app-1 generate-demo-keys-base64). */
function bufferToBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, ""); // Remove padding
}

/** Step 1: Generate only the two keys (public + private). Public X/Y are base64url for JWK (exact same as demo generate-demo-keys-base64). */
export function generateKeysOnly(): KeyPairOnly {
  const keyPair = ec.genKeyPair();
  const privateKeyHex = keyPair.getPrivate("hex");
  const publicKey = keyPair.getPublic();

  // Get X and Y coordinates as Buffers (32 bytes each) — same as demo
  const xBuffer = publicKey.getX().toArrayLike(Buffer, "be", 32);
  const yBuffer = publicKey.getY().toArrayLike(Buffer, "be", 32);

  const publicKeyX = bufferToBase64Url(xBuffer as Buffer);
  const publicKeyY = bufferToBase64Url(yBuffer as Buffer);

  return { privateKeyHex, publicKeyX, publicKeyY };
}

/** Step 2: Build DID document from existing keys + type + id. Expects publicKeyX/Y as base64url (from generateKeysOnly). */
export function buildDidDocumentFromKeys(
  publicKeyX: string,
  publicKeyY: string,
  type: DidDocumentType,
  id: string
): { did: string; didDocument: Record<string, unknown> } {
  const did = buildDid(type, id);
  const didDocument: Record<string, unknown> = {
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: did,
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: "JsonWebKey2020",
        controller: did,
        publicKeyJwk: {
          kty: "EC",
          crv: "secp256k1",
          x: publicKeyX,
          y: publicKeyY,
        },
      },
    ],
    authentication: [`${did}#key-1`],
  };
  return { did, didDocument };
}

/** Legacy: generate key pair and DID in one go (for backward compat). */
export function generateKeyPair(type: DidDocumentType, id: string): KeyPairResult {
  const keys = generateKeysOnly();
  const { did, didDocument } = buildDidDocumentFromKeys(keys.publicKeyX, keys.publicKeyY, type, id);
  return {
    ...keys,
    did,
    didDocument,
    type,
    id,
  };
}

const ENV_KEYS: Record<DidDocumentType, { did: string; privateKey: string }> = {
  client: { did: "CLIENT_DID", privateKey: "CLIENT_PRIVATE_KEY" },
  server: { did: "SERVER_DID", privateKey: "SERVER_PRIVATE_KEY" },
  core: { did: "CORE_DID", privateKey: "CORE_PRIVATE_KEY" },
};

/** Exact .env format: two lines, no 0x prefix. Key names depend on type. */
export function toEnvSnippet(did: string, privateKeyHex: string, type: DidDocumentType): string {
  const { did: didKey, privateKey: pkKey } = ENV_KEYS[type];
  return `${didKey}=${did}\n${pkKey}=${privateKeyHex}`;
}

/** Masked .env snippet for display (private key as dots). */
export function toEnvSnippetMasked(did: string, type: DidDocumentType): string {
  const { did: didKey, privateKey: pkKey } = ENV_KEYS[type];
  return `${didKey}=${did}\n${pkKey}=${"•".repeat(64)}`;
}
