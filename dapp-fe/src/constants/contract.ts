const envContractAddress = import.meta.env.VITE_CONTRACT_ADDRESS?.trim();

if (!envContractAddress) {
  console.warn("VITE_CONTRACT_ADDRESS chưa được set trong dapp-fe/.env");
}

export const CONTRACT_ADDRESS = envContractAddress ?? "";

export const CONTRACT_ABI = [
  "function issueCertificate(bytes32 hash, string calldata ipfsCid, string calldata projectName, string calldata description)",
  "function listDocumentForSale(bytes32 hash, uint256 price)",
  "function updateSalePrice(bytes32 hash, uint256 newPrice)",
  "function cancelSale(bytes32 hash)",
  "function buyDocument(bytes32 hash) payable",
  "function getSaleInfo(bytes32 hash) view returns (uint256 price, bool forSale, uint256 soldCount)",
  "function getMyRecord(bytes32 hash) view returns (address issuer, uint256 timestamp, bool valid, string ipfsCid, string projectName, string description)",
  "function verifyCertificate(bytes32 hash) returns (address issuer, uint256 timestamp, bool valid)",
  "function revokeCertificate(bytes32 hash)",
  "function isHashExists(bytes32 hash) view returns (bool)",
  "function getCertificate(bytes32 hash) view returns (tuple(address issuer, uint256 timestamp, bool valid))",
];
