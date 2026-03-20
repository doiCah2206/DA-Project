import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@oasisprotocol/sapphire-hardhat";
import "@nomicfoundation/hardhat-verify";

import dotenv from "dotenv";
dotenv.config();
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sapphireTestnet: {
      url: "https://testnet.sapphire.oasis.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 0x5aff, // 0x5aff is 23295 in decimal
      gasPrice: 100000000000, //  10 gwei
      timeout: 120000, // 120 seconds
      httpHeaders: {
        "User-Agent": "Hardhat",
      },
    },
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
