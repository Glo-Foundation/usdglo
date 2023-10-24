import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@openzeppelin/hardhat-defender";
import "@nomicfoundation/hardhat-foundry";

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
  networks: {
    mainnet: {
      url: process.env.NETWORK_MAINNET_URL as string,
    },
    polygon: {
      url: process.env.NETWORK_POLYGON_URL as string,
    },
    goerli: {
      url: process.env.NETWORK_GOERLI_URL as string,
    },
    polygonMumbai: {
      url: process.env.NETWORK_MUMBAI_URL as string,
    },
    celo: {
      url: process.env.NETWORK_CELO_URL as string,
    optimisticEthereum: {
      url: process.env.NETWORK_OPTIMISM_URL as string,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_MAINNET_API_KEY as string,
      polygon: process.env.POLYGONSCAN_POLYGON_API_KEY as string,
      goerli: process.env.ETHERSCAN_GOERLI_API_KEY as string,
      polygonMumbai: process.env.POLYGONSCAN_MUMBAI_API_KEY as string,
      celo: process.env.CELOSCAN_MAINNET_API_KEY as string,
      optimisticEthereum: process.env.OPTIMISM_MAINNET_API_KEY as string,
    },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io/",
        },
      },
    ],
  },
};

export default config;
