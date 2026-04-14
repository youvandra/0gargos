import { Wallet } from "ethers";

const deployer = Wallet.createRandom();
const bundler = Wallet.createRandom();
const device = Wallet.createRandom();

console.log("=== Generated keys (KEEP PRIVATE KEYS SECRET) ===\n");

console.log("[Deployer]");
console.log("DEPLOYER_ADDRESS=", deployer.address);
console.log("DEPLOYER_PRIVATE_KEY=", deployer.privateKey);
console.log("");

console.log("[Bundler]");
console.log("BUNDLER_ADDRESS=", bundler.address);
console.log("BUNDLER_PRIVATE_KEY=", bundler.privateKey);
console.log("");

console.log("[Device]");
console.log("DEVICE_ADDRESS=", device.address);
console.log("DEVICE_PRIVATE_KEY=", device.privateKey);
console.log("");

console.log("Next steps:");
console.log("- Fund DEPLOYER_ADDRESS and BUNDLER_ADDRESS on 0G Galileo testnet faucet.");
console.log("- Put DEPLOYER_PRIVATE_KEY into contracts/hardhat/.env");
console.log("- Put DEVICE_ADDRESS into contracts/hardhat/.env");
console.log("- Flash DEVICE_PRIVATE_KEY into the ESP32 firmware (MVP provisioning).");

