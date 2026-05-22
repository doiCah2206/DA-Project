# DocChain Contracts (dapp-contracts)

Hardhat workspace for DocChain smart contracts targeting Oasis Sapphire testnet.

## Requirements

- Node.js 18+ recommended

## Setup

```bash
npm install
```

Create a `.env` file in `dapp-contracts`:

```
PRIVATE_KEY=
```

## Common commands

```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network sapphireTestnet
```

## Networks

- `sapphireTestnet` (chainId 0x5aff / 23295)

## Notes

- After deploying, update `VITE_CONTRACT_ADDRESS` in `dapp-fe/.env` and `CONTRACT_ADDRESS` in `dapp-be/.env`.
