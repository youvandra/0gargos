# Bundler (Self-hosted)

For this MVP we self-host an ERC-4337 bundler using **Alto** (open-source).

Why Alto?
- It’s a production-grade ERC-4337 bundler implementation.
- It can run on **custom EVM chains** (like 0G Galileo) when you self-host it.

## Option A (recommended): run Alto from source

1) Clone & build Alto:

```bash
git clone https://github.com/pimlicolabs/alto.git
cd alto
pnpm install
pnpm build:contracts
pnpm build
```

2) Create a config file from our template:

```bash
cp alto-config.example.json alto-config.json
```

3) Fill these fields in `alto-config.json`:

- `rpc-url`: `https://evmrpc-testnet.0g.ai`
- `entrypoints`: your deployed EntryPoint address
- `executor-private-keys`: one or more funded private keys (we use `BUNDLER_PRIVATE_KEY`)
- `utility-private-key`: a funded private key (can be the same for MVP)

4) Run:

```bash
./alto run --config alto-config.json --safe-mode false
```

> Note: `safe-mode=false` is recommended unless your RPC supports `debug_traceCall`.

## Option B: run your own bundler implementation

You can swap Alto for any bundler that supports:
- `eth_sendUserOperation`
- `eth_estimateUserOperationGas`
- `eth_getUserOperationReceipt`
- `eth_supportedEntryPoints`

Just make sure it is configured with the same EntryPoint address you deployed.

