import { ethers } from "ethers";

// Minimal PackedUserOperation (ERC-4337 packed format used by @account-abstraction/contracts v0.8).
export type PackedUserOperation = {
  sender: string;
  nonce: string; // uint256 hex
  initCode: string; // bytes
  callData: string; // bytes
  accountGasLimits: string; // bytes32
  preVerificationGas: string; // uint256 hex
  gasFees: string; // bytes32
  paymasterAndData: string; // bytes
  signature: string; // bytes
};

function packUint128Pair(high: bigint, low: bigint): string {
  // bytes32 = uint128(high) || uint128(low)
  const v = (high << 128n) | low;
  return ethers.toBeHex(v, 32);
}

export async function buildAndSignUserOp(opts: {
  rpcUrl: string;
  chainId: number;
  entryPoint: string;
  factory: string;
  demoTarget: string;
  ownerPrivateKey: string;
  deviceAddress: string;
  thresholdWei: bigint;
  salt?: bigint;
  bundlerUrl: string;
}): Promise<{ userOp: PackedUserOperation; userOpHash: string; sender: string }> {
  const provider = new ethers.JsonRpcProvider(opts.rpcUrl, opts.chainId);

  const entryPointAbi = [
    "function getNonce(address sender, uint192 key) view returns (uint256)",
    "function getUserOpHash((address sender,uint256 nonce,bytes initCode,bytes callData,bytes32 accountGasLimits,uint256 preVerificationGas,bytes32 gasFees,bytes paymasterAndData,bytes signature) userOp) view returns (bytes32)"
  ];
  const factoryAbi = [
    "function getAddress(address owner,address device,uint256 thresholdWei,uint256 salt) view returns (address)",
    "function createAccount(address owner,address device,uint256 thresholdWei,uint256 salt) returns (address)"
  ];
  const accountAbi = ["function execute(address target,uint256 value,bytes data)"];
  const demoAbi = ["function ping()"];

  const entryPoint = new ethers.Contract(opts.entryPoint, entryPointAbi, provider);
  const factory = new ethers.Contract(opts.factory, factoryAbi, provider);

  const owner = new ethers.Wallet(opts.ownerPrivateKey).address;
  const salt = opts.salt ?? 0n;

  // NOTE: ethers.Contract has a built-in getAddress() method (no args),
  // so we must call the Solidity function via getFunction().
  const sender = (await factory
    .getFunction("getAddress")
    .staticCall(owner, opts.deviceAddress, opts.thresholdWei, salt)) as string;
  const senderCode = await provider.getCode(sender);

  const initCode =
    senderCode !== "0x"
      ? "0x"
      : ethers.concat([
          opts.factory,
          factory.interface.encodeFunctionData("createAccount", [owner, opts.deviceAddress, opts.thresholdWei, salt])
        ]);

  // callData: account.execute(demoTarget, 0, demo.ping())
  const demoIface = new ethers.Interface(demoAbi);
  const callDemo = demoIface.encodeFunctionData("ping", []);
  const accountIface = new ethers.Interface(accountAbi);
  const callData = accountIface.encodeFunctionData("execute", [opts.demoTarget, 0n, callDemo]);

  // Gas defaults (bundler will estimate; we keep sane placeholders)
  const verificationGasLimit = 800_000n;
  const callGasLimit = 200_000n;
  const accountGasLimits = packUint128Pair(verificationGasLimit, callGasLimit);

  const maxPriorityFeePerGas = 0n;
  const maxFeePerGas = 1_000_000_000n; // 1 gwei default
  const gasFees = packUint128Pair(maxPriorityFeePerGas, maxFeePerGas);

  const nonce = (await entryPoint.getNonce(sender, 0)) as bigint;

  const userOp: PackedUserOperation = {
    sender,
    nonce: ethers.toBeHex(nonce),
    initCode: initCode as string,
    callData,
    accountGasLimits,
    preVerificationGas: ethers.toBeHex(80_000n),
    gasFees,
    paymasterAndData: "0x",
    signature: "0x"
  };

  // Compute hash on-chain (covers chainId + entrypoint + fields except signature)
  const userOpHash = (await entryPoint.getUserOpHash(userOp)) as string;

  // Sign the digest (NO personal_sign prefix)
  const signingKey = new ethers.SigningKey(opts.ownerPrivateKey);
  const sig = signingKey.sign(userOpHash);
  userOp.signature = ethers.Signature.from(sig).serialized;

  return { userOp, userOpHash, sender };
}
