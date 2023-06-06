# usdglo

You can find the current contracts [here](contracts/v2)

USDGLO is deployed on:

1. [Mainnet](https://etherscan.io/token/0x4F604735c1cF31399C6E711D5962b2B3E0225AD3)
2. [Polygon](https://polygonscan.com/address/0x4F604735c1cF31399C6E711D5962b2B3E0225AD3)

## Tasks

### Install dependencies

`npm install`

### Setup git hooks

`npm run prepare`

### Compile contracts

`npm run compile`

### Running tests

`npm run test`

`forge test --no-match-contract USDGLO_Fork_Test`

### Fork tests

```
npx hardhat node --fork $ETH_RPC_URL
npx hardhat run --network localhost scripts/forceImport.ts
npx hardhat run --network localhost scripts/prepareUpgrade2.ts
forge test --match-contract USDGLO_Fork --rpc-url http://127.0.0.1:8545
```

### Invariant tests

`forge test --match-test invariant_sumOfBalancesIsNeverMoreThanMaxAllowed`

### Running coverage

`npm run coverage`

### Running tests and report gas

`REPORT_GAS=True npm run test`

### Run slither on contracts

`npm run slither`

### Run prettier on codebase

`npm run fmt`
