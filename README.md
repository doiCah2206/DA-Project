# DocChain Monorepo

DocChain is a full-stack dApp for notarizing, sharing, and selling documents on-chain. This repo contains:

- `dapp-fe`: React + Vite frontend
- `dapp-be`: Express + Postgres backend (REST + Socket.io)
- `dapp-contracts`: Hardhat smart contracts (Oasis Sapphire testnet)

## Quick start

1) Install dependencies for each package:

```bash
cd dapp-be && npm install
cd ../dapp-fe && npm install
cd ../dapp-contracts && npm install
```

2) Configure environment variables (see each package README).

3) Run the backend (default port 3000):

```bash
cd dapp-be
npm run dev
```

4) Run the frontend (default port 5173):

```bash
cd dapp-fe
npm run dev
```

5) Compile or deploy contracts as needed:

```bash
cd dapp-contracts
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network sapphireTestnet
```

## Environment overview

Frontend (dapp-fe):
- `VITE_API_URL` (default `http://localhost:3000/api`)
- `VITE_SOCKET_URL` (default `http://localhost:3000`)
- `VITE_CONTRACT_ADDRESS`
- `VITE_PINATA_JWT` (used for uploads)

Backend (dapp-be):
- `PORT`, `CLIENT_ORIGIN`, `CORS_ALLOW_ALL`
- `JWT_SECRET`
- Database: `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`
- Contract listener: `CONTRACT_ADDRESS`, `SAPPHIRE_RPC`
- Encryption: `KEY_ENCRYPTION_SECRET` (required), optional `KMS_PROVIDER`, `AWS_KMS_KEY_ID`, `AWS_REGION`

Contracts (dapp-contracts):
- `PRIVATE_KEY` for deployment to Sapphire testnet

## Project structure

```
.
├── dapp-be
├── dapp-contracts
└── dapp-fe
```

## Notes

- Chain: Oasis Sapphire Testnet (chainId 0x5aff / 23295)
- Backend will auto-create required tables on startup.
- Update `VITE_CONTRACT_ADDRESS` after deploying contracts.
