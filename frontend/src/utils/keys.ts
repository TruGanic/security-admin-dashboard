import { ec as EC } from "elliptic";

const ec = new EC("secp256k1");
const DID_BASE = "did:web:truganic.github.io:did-documents";

export type DidDocumentType = "client" | "server" | "core";

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

export function generateKeyPair(type: DidDocumentType, id: string): KeyPairResult {
  const keyPair = ec.genKeyPair();
  const privateKeyHex = keyPair.getPrivate("hex");
  const pub = keyPair.getPublic();
  const publicKeyX = pub.getX().toString("hex");
  const publicKeyY = pub.getY().toString("hex");
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
  return {
    privateKeyHex,
    publicKeyX,
    publicKeyY,
    did,
    didDocument,
    type,
    id,
  };
}

/** Exact .env format: two lines, no 0x prefix */
export function toEnvSnippet(did: string, privateKeyHex: string): string {
  return `CLIENT_DID=${did}\nCLIENT_PRIVATE_KEY=${privateKeyHex}`;
}
