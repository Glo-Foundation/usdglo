import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@openzeppelin/hardhat-defender";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 20_000,
      },
    },
  },
  defender: {
    apiKey: process.env.DEFENDER_API_KEY as string,
    apiSecret: process.env.DEFENDER_API_SECRET as string,
  },
};

export default config;
