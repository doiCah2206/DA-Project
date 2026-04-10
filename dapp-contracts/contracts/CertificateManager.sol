// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CertificateManager {
    address private owner;

    struct Certificate {
        address issuer; // Nguoi cap
        uint256 timestamp; // Thoi gian cap
        bool valid; // Trang thai
    }

    // Public info: ai cung verify duoc
    mapping(bytes32 => Certificate) private certificates;

    // ← THEM: 4 mapping private — chi issuer/owner doc duoc
    mapping(bytes32 => string) private _ipfsCid; // CID tren IPFS/Pinata
    mapping(bytes32 => string) private _projectName; // Ten du an / tai lieu
    mapping(bytes32 => string) private _description; // Mo ta

    // ← SUA: doi string → bytes32 de tiet kiem gas va an toan hon
    event CertificateIssued(bytes32 indexed hash, address issuer);
    event CertificateRevoked(bytes32 indexed hash);
    event AccessLogged(
        bytes32 indexed hash,
        address verifier,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    // ← SUA: doi param tu string → bytes32
    function isHashExists(bytes32 hash) public view returns (bool) {
        return certificates[hash].timestamp != 0;
    }

    // ← SUA: them 3 param moi: ipfsCid, projectName, description
    function issueCertificate(
        bytes32 hash,
        string calldata ipfsCid,
        string calldata projectName,
        string calldata description
    ) public {
        require(hash != bytes32(0), "CM: Hash rong");
        require(!isHashExists(hash), "CM: Hash da ton tai");
        require(bytes(ipfsCid).length > 0, "CM: IPFS CID rong");

        certificates[hash] = Certificate({
            issuer: msg.sender,
            timestamp: block.timestamp,
            valid: true
        });

        // ← THEM: luu metadata private vao mapping rieng biet
        _ipfsCid[hash] = ipfsCid;
        _projectName[hash] = projectName;
        _description[hash] = description;

        emit CertificateIssued(hash, msg.sender);
    }

    // Chi tra public info (issuer/timestamp/valid) — KHONG lo CID/key
    function verifyCertificate(
        bytes32 hash
    ) public returns (address issuer, uint256 timestamp, bool valid) {
        require(isHashExists(hash), "CM: Hash khong ton tai");
        Certificate memory cert = certificates[hash];
        emit AccessLogged(hash, msg.sender, block.timestamp);
        return (cert.issuer, cert.timestamp, cert.valid);
    }

    // ← THEM: check quyen — chi issuer hoac contract owner moi doc duoc
    function getCertificate(
        bytes32 hash
    ) public view returns (Certificate memory) {
        require(isHashExists(hash), "CM: Hash khong ton tai");
        Certificate memory cert = certificates[hash];
        require(
            msg.sender == cert.issuer || msg.sender == owner,
            "CM: Khong co quyen truy cap"
        );
        return cert;
    }

    // ← THEM: ham moi — tra field private, chi issuer/owner doc duoc
    function getMyRecord(
        bytes32 hash
    )
        public
        view
        returns (
            address issuer,
            uint256 timestamp,
            bool valid,
            string memory ipfsCid,
            string memory projectName,
            string memory description
        )
    {
        require(isHashExists(hash), "CM: Hash khong ton tai");
        Certificate memory cert = certificates[hash];
        require(
            msg.sender == cert.issuer || msg.sender == owner,
            "CM: Khong co quyen truy cap"
        );
        return (
            cert.issuer,
            cert.timestamp,
            cert.valid,
            _ipfsCid[hash],
            _projectName[hash],
            _description[hash]
        );
    }

    // ← SUA: error message ngan gon hon, khop voi test
    function revokeCertificate(bytes32 hash) public {
        require(isHashExists(hash), "CM: Hash khong ton tai");
        Certificate storage cert = certificates[hash];
        require(
            cert.issuer == msg.sender,
            "CM: Chi co nguoi cap moi thu hoi duoc"
        );
        require(cert.valid, "CM: Da bi thu hoi roi");
        cert.valid = false;
        emit CertificateRevoked(hash);
    }
}
