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

const COORD_BYTES = 32; // secp256k1

/** Bytes (big-endian) to base64url for JWK (RFC 7517). */
function bytesToBase64Url(bytes: number[]): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Step 1: Generate only the two keys (public + private). Public X/Y are base64url for JWK. */
export function generateKeysOnly(): KeyPairOnly {
  const keyPair = ec.genKeyPair();
  const privateKeyHex = keyPair.getPrivate("hex");
  const pub = keyPair.getPublic();
  const publicKeyX = bytesToBase64Url(pub.getX().toArray("be", COORD_BYTES));
  const publicKeyY = bytesToBase64Url(pub.getY().toArray("be", COORD_BYTES));
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
