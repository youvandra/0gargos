import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";

export type StorageUploadResult = {
  rootHash?: string;
  txHash?: string;
};

export async function uploadJsonTo0GStorage(payload: unknown): Promise<StorageUploadResult | null> {
  const pk = process.env.STORAGE_SIGNER_PRIVATE_KEY;
  if (!pk) return null;

  const RPC_URL = process.env.OG_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
  const INDEXER_RPC = process.env.OG_STORAGE_INDEXER_RPC ?? "https://indexer-storage-testnet-turbo.0g.ai";

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(pk, provider);
  const indexer = new Indexer(INDEXER_RPC);

  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const mem = new MemData(bytes);

  const [tree, treeErr] = await mem.merkleTree();
  if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

  const [tx, uploadErr] = await indexer.upload(mem, RPC_URL, signer);
  if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

  if ("rootHash" in tx) {
    return { rootHash: tx.rootHash, txHash: tx.txHash };
  }

  // fragmented case (unlikely for small JSON)
  return { rootHash: tx.rootHashes?.[0], txHash: tx.txHashes?.[0] };
}

