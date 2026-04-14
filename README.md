# 0GArgos MVP (0G Galileo)

End-to-end MVP/PoC:

- **Firmware (ESP32-S3 + 2.4\" SPI TFT + 1 button)**: displays the real request details, approve/deny, then signs a *challenge* → produces a **PIP (Physical Interaction Proof)**.
- **Next.js app (frontend + API routes)**: Notion-style UI (black/white + highlight `#954f1f`) + endpoints for device polling + audit log.
- **Smart contracts (ERC-4337)**: deploy **EntryPoint** + **SimpleAccount/Factory** (customized) to require a **device signature** (2FA) based on policy (e.g., amount threshold).
- **Bundler (self-host)**: Node.js service running an open-source bundler to accept `eth_sendUserOperation` and call `handleOps` on EntryPoint.
- **0G Storage**: store PIP/metadata on 0G Storage using `@0gfoundation/0g-ts-sdk`.
- **0G DA (optional / advanced)**: example integration via DA Client gRPC (requires running a DA client + encoder per 0G docs).

## Network (0G Galileo Testnet)

- RPC: `https://evmrpc-testnet.0g.ai`
- Chain ID: `16602`
- Explorer: `https://chainscan-galileo.0g.ai`

## Hardware pin mapping (ESP32-S3)

Display: **Adafruit_ST7789** (2.4" SPI, 240x320)

```c
#define TFT_CS   15
#define TFT_DC   2
#define TFT_RST  4
#define TFT_MOSI 23
#define TFT_SCK  18
#define TFT_MISO 19

#define BTN_PIN  21
```

## Keys & environment variables

For this MVP we use **two separate keys**:

- `DEPLOYER_PRIVATE_KEY`: deploys EntryPoint + account factory + app contracts
- `BUNDLER_PRIVATE_KEY`: used by the bundler to send `handleOps` transactions

Both wallets must be funded with testnet 0G.

## Important note (MVP)

The concept document mentions **SRAM PUF**. For the Arduino MVP we will start with a **provisioned & stored device keypair** (demo-friendly). Later we can upgrade to a stronger design (ESP-IDF + secure boot/flash encryption + PUF/helper-data).

## Folder structure (to be populated)

```
0gargos-mvp/
  apps/
    web/                # Next.js (UI + API)
  contracts/
    hardhat/            # EntryPoint + account + factory + tests
  services/
    bundler/            # Node bundler service (JSON-RPC)
    da-client/          # (optional) gRPC client to submit blob to DA node
  firmware/
    esp32/              # Arduino sketch + TFT/button config
```

## Quick start (local dev)

1) Install dependencies:

```bash
cd 0gargos-mvp
npm install
```

2) Generate demo keys (deployer, bundler, device):

```bash
npm run keys:gen
```

3) Fund wallets on 0G Galileo testnet faucet (at least deployer + bundler).

4) Configure contracts env:

```bash
cp contracts/hardhat/.env.example contracts/hardhat/.env
# Fill: DEPLOYER_PRIVATE_KEY, DEVICE_ADDRESS
```

5) Deploy EntryPoint + factory:

```bash
npm run contracts:deploy
```

6) Start the web app:

```bash
cp apps/web/.env.example apps/web/.env
npm run web:dev
```

7) Flash firmware:

- Update WiFi + `APP_BASE_URL` in `firmware/esp32/0gargos_device.ino`
- Upload to ESP32-S3 using Arduino IDE

8) Create a request in the web UI and approve it from the device.
