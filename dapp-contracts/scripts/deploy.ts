import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  const ContractFactory = await ethers.getContractFactory("CertificateManager");
  const contract = await ContractFactory.deploy();

  await contract.waitForDeployment();

  console.log("CertificateManager deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
