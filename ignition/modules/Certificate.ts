// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CertificateModule = buildModule("CertificateModule", (m) => {
  const certificate = m.contract("Certificate");

  return { certificate };
});

export default CertificateModule;
