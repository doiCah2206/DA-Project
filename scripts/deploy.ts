import { ethers } from "hardhat";

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    const LockContract = await ethers.getContractFactory("Lock");
    // Set unlock time to 1 hour from now
    const unlockTime = Math.floor(Date.now() / 1000) + 60 * 60;
    const utils = await LockContract.deploy(unlockTime);
    await utils.waitForDeployment();
    console.log("Lock contract deployed to:", await utils.getAddress());
    console.log("Unlock time:", unlockTime);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
main();
