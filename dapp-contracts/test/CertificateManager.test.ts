import { expect } from "chai";
import { ethers } from "hardhat";
import { CertificateManager } from "../typechain-types";

describe("CertificateManager", () => {
  let cm: CertificateManager;
  let owner: any, addr1: any, addr2: any;

  // bytes32 hash hợp lệ
  const testHash =
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const testHash2 =
    "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
  const zeroHash = ethers.ZeroHash; // 0x000...000

  const ipfsCid = "QmTestCID123456789";
  const projectName = "Hợp đồng mẫu";
  const description = "Mô tả dự án";

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertificateManager");
    cm = await Factory.deploy();
    await cm.waitForDeployment();
  });

  // ─── Deployment ────────────────────────────────────────────────────────────
  describe("Deployment", () => {
    it("should set correct owner", async () => {
      expect(await cm.getOwner()).to.equal(owner.address);
    });
  });

  // ─── issueCertificate ──────────────────────────────────────────────────────
  describe("issueCertificate", () => {
    it("should issue certificate with all fields", async () => {
      await cm.issueCertificate(testHash, ipfsCid, projectName, description);
      expect(await cm.isHashExists(testHash)).to.equal(true);
    });

    it("should emit CertificateIssued event", async () => {
      await expect(
        cm.issueCertificate(testHash, ipfsCid, projectName, description),
      )
        .to.emit(cm, "CertificateIssued")
        .withArgs(testHash, owner.address);
    });

    it("should revert on duplicate hash", async () => {
      await cm.issueCertificate(testHash, ipfsCid, projectName, description);
      await expect(
        cm.issueCertificate(testHash, ipfsCid, projectName, description),
      ).to.be.revertedWith("CM: Hash da ton tai");
    });

    it("should revert on zero hash", async () => {
      await expect(
        cm.issueCertificate(zeroHash, ipfsCid, projectName, description),
      ).to.be.revertedWith("CM: Hash rong");
    });

    it("should revert on empty ipfsCid", async () => {
      await expect(
        cm.issueCertificate(testHash, "", projectName, description),
      ).to.be.revertedWith("CM: IPFS CID rong");
    });
  });

  // ─── getMyRecord (OWNER-ONLY) ──────────────────────────────────────────────
  describe("getMyRecord — owner-only access", () => {
    beforeEach(async () => {
      // addr1 là người issue
      await cm
        .connect(addr1)
        .issueCertificate(testHash, ipfsCid, projectName, description);
    });

    it("issuer can read own private record", async () => {
      const [, , , cid, pname, desc] = await cm
        .connect(addr1)
        .getMyRecord(testHash);
      expect(cid).to.equal(ipfsCid);
      expect(pname).to.equal(projectName);
      expect(desc).to.equal(description);
    });

    it("contract owner (admin) can read any record", async () => {
      // owner (deployer) không phải issuer nhưng vẫn đọc được
      const [issuer, , , cid] = await cm.connect(owner).getMyRecord(testHash);
      expect(issuer).to.equal(addr1.address);
      expect(cid).to.equal(ipfsCid);
    });

    it("stranger CANNOT read private record", async () => {
      // addr2 không phải issuer, không phải owner → phải revert
      await expect(cm.connect(addr2).getMyRecord(testHash)).to.be.revertedWith(
        "CM: Khong co quyen truy cap",
      );
    });

    it("should revert on non-existent hash", async () => {
      await expect(cm.connect(addr1).getMyRecord(testHash2)).to.be.revertedWith(
        "CM: Hash khong ton tai",
      );
    });
  });

  // ─── getCertificate (OWNER-ONLY) ───────────────────────────────────────────
  describe("getCertificate — owner-only access", () => {
    beforeEach(async () => {
      await cm
        .connect(addr1)
        .issueCertificate(testHash, ipfsCid, projectName, description);
    });

    it("issuer can get own certificate struct", async () => {
      const cert = await cm.connect(addr1).getCertificate(testHash);
      expect(cert.issuer).to.equal(addr1.address);
      expect(cert.valid).to.equal(true);
    });

    it("stranger CANNOT get certificate struct", async () => {
      await expect(
        cm.connect(addr2).getCertificate(testHash),
      ).to.be.revertedWith("CM: Khong co quyen truy cap");
    });
  });

  // ─── isHashExists ──────────────────────────────────────────────────────────
  describe("isHashExists", () => {
    it("returns false for non-existent hash", async () => {
      expect(await cm.isHashExists(testHash)).to.equal(false);
    });

    it("returns true after issue", async () => {
      await cm.issueCertificate(testHash, ipfsCid, projectName, description);
      expect(await cm.isHashExists(testHash)).to.equal(true);
    });
  });
});
