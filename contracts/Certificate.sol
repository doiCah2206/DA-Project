pragma solidity ^0.8.28;

contract Certificate {
    struct Cert {
        address issuer;
        uint timestamp;
        bool valid;
    }

    mapping(string => Cert) public certificates;

    function issueCertificate(string memory hash) public {
        certificates[hash] = Cert(msg.sender, block.timestamp, true);
    }

    function verifyCertificate(string memory hash) public view returns (bool) {
        return certificates[hash].valid;
    }

    function revokeCertificate(string memory hash) public {
        require(certificates[hash].issuer == msg.sender);
        certificates[hash].valid = false;
    }
}