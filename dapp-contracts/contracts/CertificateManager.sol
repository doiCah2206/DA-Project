// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CertificateManager {
    address private owner;

    struct Certificate {
        address issuer;
        uint256 timestamp;
        bool valid;
    }

    struct SaleInfo {
        uint256 price;
        bool forSale;
        uint256 soldCount;
    }

    mapping(bytes32 => Certificate) private certificates;
    mapping(bytes32 => string) private _ipfsCid;
    mapping(bytes32 => string) private _projectName;
    mapping(bytes32 => string) private _description;
    mapping(bytes32 => SaleInfo) private sales;
    mapping(bytes32 => mapping(address => bool)) private buyers;

    event CertificateIssued(bytes32 indexed hash, address issuer);
    event CertificateRevoked(bytes32 indexed hash);
    event AccessLogged(
        bytes32 indexed hash,
        address verifier,
        uint256 timestamp
    );

    event DocumentListedForSale(
        bytes32 indexed hash,
        uint256 price,
        address seller
    );
    event DocumentPurchased(bytes32 indexed hash, address buyer, uint256 price);
    event DocumentSaleCancelled(bytes32 indexed hash);

    constructor() {
        owner = msg.sender;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function isHashExists(bytes32 hash) public view returns (bool) {
        return certificates[hash].timestamp != 0;
    }

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

        _ipfsCid[hash] = ipfsCid;
        _projectName[hash] = projectName;
        _description[hash] = description;

        emit CertificateIssued(hash, msg.sender);
    }

    function verifyCertificate(
        bytes32 hash
    ) public returns (address issuer, uint256 timestamp, bool valid) {
        require(isHashExists(hash), "CM: Hash khong ton tai");
        Certificate memory cert = certificates[hash];
        emit AccessLogged(hash, msg.sender, block.timestamp);
        return (cert.issuer, cert.timestamp, cert.valid);
    }

    function listDocumentForSale(bytes32 hash, uint256 price) public {
        require(isHashExists(hash), "CM: Hash khong ton tai");
        require(price > 0, "CM: Gia khong hop le");

        Certificate memory cert = certificates[hash];
        require(
            msg.sender == cert.issuer || msg.sender == owner,
            "CM: Khong co quyen"
        );

        SaleInfo storage sale = sales[hash];
        sale.price = price;
        sale.forSale = true;

        emit DocumentListedForSale(hash, price, msg.sender);
    }

    function cancelSale(bytes32 hash) public {
        require(isHashExists(hash), "CM: Hash khong ton tai");

        Certificate memory cert = certificates[hash];
        require(
            msg.sender == cert.issuer || msg.sender == owner,
            "CM: Khong co quyen"
        );

        delete sales[hash];
        emit DocumentSaleCancelled(hash);
    }

    function buyDocument(bytes32 hash) public payable {
        require(isHashExists(hash), "CM: Hash khong ton tai");

        SaleInfo storage sale = sales[hash];
        require(sale.forSale, "CM: Chua duoc ban");
        require(msg.value == sale.price, "CM: Sai so tien");
        require(
            msg.sender != certificates[hash].issuer,
            "CM: Nguoi cap khong the mua"
        );
        require(!buyers[hash][msg.sender], "CM: Da mua tai lieu");

        buyers[hash][msg.sender] = true;
        sale.soldCount += 1;

        address payable seller = payable(certificates[hash].issuer);
        (bool sent, ) = seller.call{value: msg.value}("");
        require(sent, "CM: Chuyen tien that bai");

        emit DocumentPurchased(hash, msg.sender, msg.value);
    }

    function canAccess(bytes32 hash, address user) public view returns (bool) {
        if (!isHashExists(hash)) {
            return false;
        }

        Certificate memory cert = certificates[hash];
        return user == cert.issuer || user == owner || buyers[hash][user];
    }

    function getCertificate(
        bytes32 hash
    ) public view returns (Certificate memory) {
        require(isHashExists(hash), "CM: Hash khong ton tai");
        require(canAccess(hash, msg.sender), "CM: Khong co quyen truy cap");
        return certificates[hash];
    }

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
        require(canAccess(hash, msg.sender), "CM: Khong co quyen truy cap");

        Certificate memory cert = certificates[hash];
        return (
            cert.issuer,
            cert.timestamp,
            cert.valid,
            _ipfsCid[hash],
            _projectName[hash],
            _description[hash]
        );
    }

    function getSaleInfo(
        bytes32 hash
    ) public view returns (uint256 price, bool forSale, uint256 soldCount) {
        require(isHashExists(hash), "CM: Hash khong ton tai");
        SaleInfo memory sale = sales[hash];
        return (sale.price, sale.forSale, sale.soldCount);
    }

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
