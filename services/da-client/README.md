# 0G DA client (optional)

0G DA submission requires running the **DA Client node + Encoder node** (per 0G docs).

In this MVP repo we keep DA integration **optional**:
- If you just want the MVP demo working, you can skip DA and only store PIP/metadata in **0G Storage**.
- If you want DA, run the DA client stack (Docker) and then submit blobs from your app.

## Reference

- 0G docs: “0G Data Availability (DA): Integration” (requires running DA Client + Encoder + Retriever).
- The DA client exposes a gRPC “disperser” interface used to submit blobs.

## What’s in this folder

This folder is a placeholder for a small client that will:
1) connect to your local DA client gRPC
2) submit a blob (PIP/metadata)
3) return a receipt / blob reference that we store in our audit log

