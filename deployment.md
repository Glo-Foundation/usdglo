# Deploying USDGLO

## deploy.ts

`npx hardhat run scripts/deploy.ts --network networkName`

Deploys the USDGLO contract.

It requires the following env variables to be set (assuming mainnet):

1. `DEFENDER_API_KEY`
2. `DEFENDER_API_SECRET`
3. `RELAYER_DEPLOYER_KEY`
4. `RELAYER_DEPLOYER_SECRET`
5. `INITIAL_ADMIN_ADDRESS`
6. `NETWORK_MAINNET_URL`

## proposeUpgrade.ts

`npx hardhat run scripts/proposeUpgrade.ts --network networkName`

Proposes an upgrade to the deployed USDGLO contract via OpenZeppelin Defender.

It requires the following env variables to be set (assuming mainnet):

1. `DEFENDER_API_KEY`
2. `DEFENDER_API_SECRET`
3. `RELAYER_DEPLOYER_KEY`
4. `RELAYER_DEPLOYER_SECRET`
5. `UPGRADE_CONTRACT_NAME`
6. `PROXY_ADDRESS`
7. `UPGRADE_MULTISIG`
8. `NETWORK_MAINNET_URL`

## forceImport.ts

`npx hardhat run scripts/forceImport.ts --network networkName`

Regenerates `.openzeppelin` in the event that its lost.

It requires the following env variables to be set (assuming mainnet):

1. `CURRENT_CONTRACT_NAME`
2. `PROXY_ADDRESS`
3. `NETWORK_MAINNET_URL`

## Verify deployed contract

`npx hardhat verify --network networkName proxyAddress`

It requires the following env variables to be set (assuming mainnet):

1. `ETHERSCAN_MAINNET_API_KEY`
2. `NETWORK_MAINNET_URL`

## Sign a message using a relayer

`npx hardhat run scripts/signMessage.ts`

It requires the following env variables to be set:

1. `RELAYER_DEPLOYER_KEY`
2. `RELAYER_DEPLOYER_SECRET`
3. `MESSAGE_TO_SIGN`
