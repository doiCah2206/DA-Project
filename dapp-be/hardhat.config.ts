import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@oasisprotocol/sapphire-hardhat";
import "nomicfoundation/hardhat-verify";

import dotenv from "dotenv"

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",

  }
};

export default config;
