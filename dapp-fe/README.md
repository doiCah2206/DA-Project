# DocChain Frontend (dapp-fe)

React + Vite frontend for the DocChain app.

## Requirements

- Node.js 18+ recommended

## Setup

```bash
npm install
```

Create a `.env` file in `dapp-fe`:

```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_CONTRACT_ADDRESS=
VITE_PINATA_JWT=
```

Notes:
- `VITE_CONTRACT_ADDRESS` should match the deployed contract.
- `VITE_PINATA_JWT` is used by the notarize flow to upload to Pinata.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Connected services

- Backend API (default `http://localhost:3000/api`)
- Socket.io server (default `http://localhost:3000`)
- Oasis Sapphire testnet for contract reads/writes
