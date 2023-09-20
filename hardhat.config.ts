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
    gnosisChain: {
      url: process.env.NETWORK_GNOSIS_CHAIN_URL as string,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_MAINNET_API_KEY as string,
      polygon: process.env.POLYGONSCAN_POLYGON_API_KEY as string,
      goerli: process.env.ETHERSCAN_GOERLI_API_KEY as string,
      polygonMumbai: process.env.POLYGONSCAN_MUMBAI_API_KEY as string,
      gnosisChain: process.env.GNOSISSCAN_MAINNET_API_KEY as string,
    },
    customChains: [
      {
        network: "gnosisChain",
        chainId: 100,
        urls: {
          apiURL: "https://api.gnosisscan.io/api",
          browserURL: "https://gnosisscan.io/",
        },
      },
    ],
  },
};

export default config;
