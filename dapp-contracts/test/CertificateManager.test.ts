import { expect } from "chai";
import { ethers } from "hardhat";
import { CertificateManager } from "../typechain-types";

describe("CertificateManager", () => {
  let certificateManager: CertificateManager;
  let owner: any;
  let addr1: any;
  let addr2: any;

  // Test hash
  const testHash =
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  beforeEach(async () => {
    // Lấy các accounts từ Hardhat
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contract
    const CertificateManager = await ethers.getContractFactory(
      "CertificateManager",
    );
    certificateManager = await CertificateManager.deploy();
    await certificateManager.waitForDeployment();
  });

  describe("Deployment", () => {
    it("Should set the correct owner", async () => {
      const contractOwner = await certificateManager.getOwner();
      expect(contractOwner).to.equal(owner.address);
    });
  });

  describe("issueCertificate", () => {
    it("Should issue a new certificate", async () => {
      await certificateManager.issueCertificate(testHash);

      const [issuer, timestamp, valid] =
        await certificateManager.verifyCertificate(testHash);

      expect(issuer).to.equal(owner.address);
      expect(valid).to.equal(true);
      expect(timestamp).to.be.gt(0);
    });

    it("Should revert when hash already exists", async () => {
      await certificateManager.issueCertificate(testHash);

      await expect(
        certificateManager.issueCertificate(testHash),
      ).to.be.revertedWith("CertificateManager: Hash da ton tai");
    });

    it("Should emit CertificateIssued event", async () => {
      await expect(certificateManager.issueCertificate(testHash))
        .to.emit(certificateManager, "CertificateIssued")
        .withArgs(testHash, owner.address);
    });
  });

  describe("verifyCertificate", () => {
    it("Should return correct certificate info", async () => {
      await certificateManager.issueCertificate(testHash);

      const [issuer, timestamp, valid] =
        await certificateManager.verifyCertificate(testHash);

      expect(issuer).to.equal(owner.address);
      expect(valid).to.equal(true);
      expect(timestamp).to.be.gt(0);
    });

    it("Should revert when hash does not exist", async () => {
      await expect(
        certificateManager.verifyCertificate("0xnonexistent"),
      ).to.be.revertedWith("CertificateManager: Hash khong ton tai");
    });
  });

  describe("revokeCertificate", () => {
    beforeEach(async () => {
      await certificateManager.issueCertificate(testHash);
    });

    it("Should revoke certificate successfully", async () => {
      await certificateManager.revokeCertificate(testHash);

      const [, , valid] = await certificateManager.verifyCertificate(testHash);
      expect(valid).to.equal(false);
    });

    it("Should emit CertificateRevoked event", async () => {
      await expect(certificateManager.revokeCertificate(testHash))
        .to.emit(certificateManager, "CertificateRevoked")
        .withArgs(testHash);
    });

    it("Should revert when not issuer tries to revoke", async () => {
      await expect(
        certificateManager.connect(addr1).revokeCertificate(testHash),
      ).to.be.revertedWith("CertificateManager: Chi co nguoi cap thuc hien");
    });

    it("Should revert when certificate already revoked", async () => {
      await certificateManager.revokeCertificate(testHash);

      await expect(
        certificateManager.revokeCertificate(testHash),
      ).to.be.revertedWith("CertificateManager: Certificate da bi thu hoi");
    });
  });

  describe("isHashExists", () => {
    it("Should return false for non-existent hash", async () => {
      const exists = await certificateManager.isHashExists("0xnonexistent");
      expect(exists).to.equal(false);
    });

    it("Should return true for existing hash", async () => {
      await certificateManager.issueCertificate(testHash);
      const exists = await certificateManager.isHashExists(testHash);
      expect(exists).to.equal(true);
    });
  });

  describe("getCertificate", () => {
    it("Should return full certificate info", async () => {
      await certificateManager.issueCertificate(testHash);

      const cert = await certificateManager.getCertificate(testHash);

      expect(cert.issuer).to.equal(owner.address);
      expect(cert.valid).to.equal(true);
      expect(cert.timestamp).to.be.gt(0);
    });

    it("Should revert when hash does not exist", async () => {
      await expect(
        certificateManager.getCertificate("0xnonexistent"),
      ).to.be.revertedWith("CertificateManager: Hash khong ton tai");
    });
  });
});
