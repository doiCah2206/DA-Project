export const CONTRACT_ADDRESS = '0xFC021c4E49af548a07B9E54201D064f79Dfd9359'

export const CONTRACT_ABI = [
    'function issueCertificate(bytes32 hash, string calldata ipfsCid, string calldata secretKey, string calldata projectName, string calldata description)',
    'function getMyRecord(bytes32 hash) view returns (address issuer, uint256 timestamp, bool valid, string ipfsCid, string secretKey, string projectName, string description)',
    'function verifyCertificate(bytes32 hash) returns (address issuer, uint256 timestamp, bool valid)',
    'function revokeCertificate(bytes32 hash)',
    'function isHashExists(bytes32 hash) view returns (bool)',
    'function getCertificate(bytes32 hash) view returns (tuple(address issuer, uint256 timestamp, bool valid))',
]