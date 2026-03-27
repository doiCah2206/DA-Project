// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CertificateManager {

    //  Owner (admin)
    address private owner;

    //  Struct lưu thông tin chứng chỉ
    struct Certificate {
        address issuer;     // Người cấp
        uint256 timestamp;  // Thời gian cấp
        bool valid;         // Trạng thái
    }

    //  Mapping lưu hash → certificate
    mapping(string => Certificate) private certificates;

    //  Events
    event CertificateIssued(string hash, address issuer);
    event CertificateRevoked(string hash);

    //  Constructor
    constructor() {
        owner = msg.sender;
    }

    // Lấy owner (để test)
    function getOwner() public view returns (address) {
        return owner;
    }

    //  Kiểm tra hash đã tồn tại chưa
    function isHashExists(string memory hash) public view returns (bool) {
        return certificates[hash].timestamp != 0;
    }

    //  Cấp chứng chỉ
    function issueCertificate(string memory hash) public {
        require(bytes(hash).length > 0, "CertificateManager: Hash rong");
        require(!isHashExists(hash), "CertificateManager: Hash da ton tai");

        certificates[hash] = Certificate({
            issuer: msg.sender,
            timestamp: block.timestamp,
            valid: true
        });

        emit CertificateIssued(hash, msg.sender);
    }

    //  Xác minh chứng chỉ
    function verifyCertificate(string memory hash)
        public
        view
        returns (address issuer, uint256 timestamp, bool valid)
    {
        require(isHashExists(hash), "CertificateManager: Hash khong ton tai");

        Certificate memory cert = certificates[hash];
        return (cert.issuer, cert.timestamp, cert.valid);
    }

    //  Thu hồi chứng chỉ
    function revokeCertificate(string memory hash) public {
        require(isHashExists(hash), "CertificateManager: Hash khong ton tai");

        Certificate storage cert = certificates[hash];

        require(cert.issuer == msg.sender, "CertificateManager: Chi co nguoi cap thuc hien");
        require(cert.valid == true, "CertificateManager: Certificate da bi thu hoi");

        cert.valid = false;

        emit CertificateRevoked(hash);
    }

     /// Lấy full thông tin chứng chỉ
    function getCertificate(string memory hash)
        public
        view
        returns (Certificate memory)
    {
        require(isHashExists(hash), "CertificateManager: Hash khong ton tai");
        return certificates[hash];
    }
}