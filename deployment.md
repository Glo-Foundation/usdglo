# Deploying USDGLO

## deploy.ts

`npx hardhat run scripts/deploy.ts --network networkName`

Deploys the USDGLO contract.

It requires the following env variables to be set (assuming mainnet):

1. `DEFENDER_API_KEY`
2. `DEFENDER_API_SECRET`
3. `RELAYER_DEPLOYER_KEY`
4. `RELAYER_DEPLOYER_SECRET`
5. `INITIAL_ADMIN_ADDRESS` --> this should be the wallet address you want to have admin rights, not the relayer address
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

## prepareUpgrade.ts

`npx hardhat run scripts/prepareUpgrade.ts --network networkName`

Prepares an upgrade to the deployed USDGLO contract via OpenZeppelin Defender.

Unlike `proposeUpgrade`, `prepareUpgrade` only checks if the new implementation contract is a valid upgrade, deploys the new implementation contract and finally returns the address.

You will have to manually go to OpenZeppelin Defender and create and execute a new proposal calling either `upgradeTo` or `upgradeToAndCall` on the proxy to actually upgrade the contract.

It requires the following env variables to be set (assuming mainnet):

1. `DEFENDER_API_KEY`
2. `DEFENDER_API_SECRET`
3. `RELAYER_DEPLOYER_KEY`
4. `RELAYER_DEPLOYER_SECRET`
5. `UPGRADE_CONTRACT_NAME`
6. `PROXY_ADDRESS`
7. `NETWORK_MAINNET_URL`

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

## Batch denylist addresses

`npx hardhat run scripts/batchDenylist.ts --network networkName`

Proposes a batch denylist transaction to the deployed USDGLO contract via OpenZeppelin Defender.

It requires the following env variables to be set:

1. `DEFENDER_API_KEY`
2. `DEFENDER_API_SECRET`
3. `PROXY_ADDRESS`
4. `DENYLIST_FILE`
5. `DENYLIST_TITLE`
6. `DENYLIST_DESCRIPTION`
7. `DENYLIST_MULTISIG`

`DENYLIST_FILE` should be a path pointing to a csv file containing an address to be denylisted on every line.
