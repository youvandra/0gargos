import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  const deviceAddress = process.env.DEVICE_ADDRESS ?? ethers.ZeroAddress;
  const thresholdWei = BigInt(process.env.DEVICE_VALUE_THRESHOLD_WEI ?? "0");

  console.log("Deployer:", deployer.address);
  console.log("Device:", deviceAddress);
  console.log("Threshold (wei):", thresholdWei.toString());

  // 1) Deploy EntryPoint
  const EntryPoint = await ethers.getContractFactory("EntryPoint");
  const entryPoint = await EntryPoint.deploy();
  await entryPoint.waitForDeployment();
  const entryPointAddress = await entryPoint.getAddress();
  console.log("EntryPoint:", entryPointAddress);

  // 2) Deploy Device2FAAccountFactory
  const Factory = await ethers.getContractFactory("Device2FAAccountFactory");
  const factory = await Factory.deploy(entryPointAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Device2FAAccountFactory:", factoryAddress);

  // 3) Deploy demo target (called via account.execute)
  const Demo = await ethers.getContractFactory("ArgosDemo");
  const demo = await Demo.deploy();
  await demo.waitForDeployment();
  const demoAddress = await demo.getAddress();
  console.log("ArgosDemo:", demoAddress);

  console.log("\nNext:");
  console.log(
    "- Fund the bundler/executor wallet(s) and deployer wallet with testnet 0G.\n" +
      "- Configure bundler with EntryPoint: " +
      entryPointAddress
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
