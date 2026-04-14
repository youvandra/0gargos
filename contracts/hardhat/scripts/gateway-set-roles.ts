import { ethers } from "hardhat";

/**
 * Usage:
 *  ARGOS_GATEWAY_ADDRESS=0x... APPROVER=0x... EXECUTOR=0x... npm --workspace contracts/hardhat run gateway:set-roles
 */
async function main() {
  const gatewayAddress = process.env.ARGOS_GATEWAY_ADDRESS ?? "";
  const approver = process.env.APPROVER ?? "";
  const executor = process.env.EXECUTOR ?? "";
  if (!gatewayAddress) throw new Error("Missing ARGOS_GATEWAY_ADDRESS");
  if (!approver) throw new Error("Missing APPROVER");
  if (!executor) throw new Error("Missing EXECUTOR");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const gateway = await ethers.getContractAt("ArgosGateway", gatewayAddress, deployer);
  const tx1 = await gateway.setApprover(approver);
  console.log("setApprover tx:", tx1.hash);
  await tx1.wait();

  const tx2 = await gateway.setExecutor(executor);
  console.log("setExecutor tx:", tx2.hash);
  await tx2.wait();

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

