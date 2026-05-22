# DocChain Backend (dapp-be)

Express + Postgres API with Socket.io for chat and document workflows.

## Requirements

- Node.js 18+ recommended
- Postgres 14+ recommended

## Setup

```bash
npm install
```

Create a `.env` file in `dapp-be`:

```
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
CORS_ALLOW_ALL=false
JWT_SECRET=change-me

# Database (choose one)
DATABASE_URL=
DB_HOST=localhost
DB_PORT=5432
DB_NAME=docchain
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Contract listener
CONTRACT_ADDRESS=
SAPPHIRE_RPC=https://testnet.sapphire.oasis.io

# Encryption
KEY_ENCRYPTION_SECRET=
KMS_PROVIDER=local
AWS_KMS_KEY_ID=
AWS_REGION=ap-southeast-1
```

Notes:
- `KEY_ENCRYPTION_SECRET` must be 32-byte utf8 or base64-encoded 32-byte value.
- The database schema is created automatically on server startup.
- Set `CORS_ALLOW_ALL=true` to allow any origin during development.

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## Services

- REST API: `http://localhost:3000/api`
- Socket.io: `http://localhost:3000`
