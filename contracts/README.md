# USDGLO Design document

# A stablecoin that generates basic income.

## Distinctions from a standard ERC20 token

USDGLO has two major differences compared to a standard ERC20 token:

1. Pausing

   USDGLO can be **paused**. Once paused no token minting, burning or transfers can happen.

2. Denylisting

   Addresses can be **denylisted**(_blacklisted is the term used in other stablecoins_). A denylisted address cannot be part of any token minting, burning or transfers. It is also possible to destroy the tokens held by a denylisted address and remove it from the total supply. Denylisting is introduced for regulatory purposes.

# Detailed explanation of major functions

## Roles

1. `DEFAULT_ADMIN_ROLE` → Special role which acts as the default admin role for all roles. An account with this role will be able to manage any other role. This role will be by default assigned to the contract deployer address.
2. `PAUSER_ROLE` → Only this role will be allowed to pause/unpause the USDGLO contract. Pausing stops all minting, burning and transfers.
3. `MINTER_ROLE` → Only this role will be allowed to mint USDGLO and burn USDGLO.
4. `DENYLISTER_ROLE` → Only this role will be allowed to add or remove addresses to a denylist. An address which is added to the denylist cannot be part of any minting, burning or transfer of USDGLO.
5. `UPGRADER_ROLE` → Only this role will be allowed to call `_authorizeUpgrade` method to upgrade the USDGLO contract.

All these addresses having these roles will be controlled by the Global Income Coin Foundation.

## Pausing

The entire contract can be paused in case of a bug or serious key compromise.

**Methods:**

1. `pause()`
2. `unpause()`

**Points:**

1. Minting, burning and transfers will revert when the contract is paused.
2. All other functionality like adding or removing addresses from roles, modifying the denylist, destroying funds held by a denylisted address and upgrading will still work. This is because they might be required to fix the bug/issue. Approvals will also work as it doesn’t involve any actual token transfer or change to the `_balances` object.
3. Only addresses with `PAUSER_ROLE` can pause/unpause USDGLO.
4. Pausing will emit a `Pause(pauser)` event.
5. Unpausing will emit a `Unpause(pauser)` event.

**Implementation notes:**

1. Inherit `PausableUpgradeable` from OpenZeppelin which has all the required functionality.
2. Override `_beforeTokenTransfer` and add a `whenNotPaused` modifier check to it. That will make sure minting, burning and transfers will revert when USDGLO is paused.

## Minting

Minting is the process of generating new USDGLO and adding them to the supply.

**Methods:**

1. `mint(address to, uint256 amount)`

**Points:**

1. Minting will not work if the contract is paused.
2. Only addresses with `MINTER_ROLE` can mint USDGLO.
3. Minting will fail if `to` is denylisted.
4. Minting will fail if minter is denylisted.
5. Minting will emit a `Transfer(address(0), to, amount)` event.
6. Minting will emit a `Mint(minter, to, amount)` event.

**Implementation notes:**

1. Regarding point 1: Minting involves calling the `_beforeTokenTransfer` method which checks for `whenNotPaused`.
2. Regarding point 2: `mint` method will have a `onlyRole(MINTER_ROLE)` check.
3. Regarding points 3 and 4: The internal `_mint` method checks `_requireBalanceIsNotDenylisted` on both the minters balance and the `to` address balance.

## Burning

Burning is the process of destroying existing USDGLO and removing them from the supply.

**Methods:**

1. `burn(uint256 amount)`

**Points:**

1. Burning will not work if the contract is paused.
2. Only addresses with `MINTER_ROLE` can burn USDGLO.
3. Minter can only burn USDGLO owned by them.
4. Minter cannot burn if they are denylisted.
5. Burning will emit a `Transfer(minter, address(0), amount)` event.
6. Burning will emit a `Burn(minter, amount)` event.

**Implementation notes:**

1. Regarding point 1: Burning involves calling the `_beforeTokenTransfer` method which checks for `whenNotPaused`.
2. Regarding point 3: `burn` method only allows one to burn their own token. As the method will have a `onlyRole(MINTER_ROLE)` check, point 3 is satisfied.
3. Regarding point 4: The internal `_burn` method checks `_requireBalanceIsNotDenylisted` on the minters balance.

## Upgrading

USDGLO uses the UUPS Transparent Proxy pattern to upgrade itself.

**Points:**

1. Upgrading will still work when the contract is paused.
2. Only addresses with `UPGRADER_ROLE` can upgrade the contract.
3. Denylisting of the address doesn’t stop upgrading.

## Transfers

**Methods:**

1. `transfer(address to, uint256 amount)`
2. `transferFrom(address from, address to, uint256 amount)`

P**oints:**

1. Transfers will revert if the contract is paused.
2. Transfers will revert if any of the addresses involved are denylisted.

**Implementation notes:**

1. Regarding point 1: Transfers involves calling the `_beforeTokenTransfer` method which is overridden to add a `whenNotPaused` modifier check.
2. Regarding point 2: Transfers involve calling the `_transfer` method which checks `_requireBalanceIsNotDenylisted` for both the `from` and `to`. Additionally the `transferFrom` method also has a `whenNotDenylisted` modifier check on `_msgSender()`.

## Denylisting

The current implementation of denylisting is inspired by: [https://github.com/centrehq/centre-tokens/pull/357](https://github.com/centrehq/centre-tokens/pull/357)

[https://alexkroeger.mirror.xyz/RJ1gZ8tAfqXOmfA3MJz0AkD082c-3hwr2lba-F1j3uw](https://alexkroeger.mirror.xyz/RJ1gZ8tAfqXOmfA3MJz0AkD082c-3hwr2lba-F1j3uw) was also an inspiration.

**Methods:**

1. `denylist(address denylistee)`
2. `undenylist(address denylistee)`
3. `destroyDenylistedFunds(address denylistee)`

**Points:**

1. Only addresses with `DENYLISTER_ROLE` can call denylist methods.
2. Pausing doesn’t have any affect on denylist methods.
3. A denylisted address cannot be part of any mint, burn or transfer transaction.
4. Denylisting will emit a `Denylist(denylister, denylistee)` event.
5. Un-denylisting will emit a `Undenylist(denylister, denylistee)` event.
6. Destroying denylisted funds will emit a `DestroyDenylistedFunds(denylister, denylistee, denylistedFunds)` event.

   **Implementation notes:**

7. We reuse the `_balances` object inside the ERC20 contract for denylisting. We use the highest bit of the balance of an address to indicate denylisting. bit = 1 means the address is denylisted. bit = 0 means the address is not denylisted.
8. We limit the `totalSupply` of the token to be a maximum of `(uint256(1) << 255) - 1`. This also ensures that no account can have a balance so large that it needs the highest bit of their `uint256` balance.
9. We modify the `balanceOf(address account)` function to return `_balances[account] & ~(uint256(1) << 255)`. Meaning we make the highest bit 0 and return the balance.
10. Denylisting an address is simply setting the highest bit to 1: `_balances[denylistee] = _balances[denylistee] | (uint256(1) << 255)`
11. Un-denylisting an address is simply setting the highest bit back to 0: `_balances[denylistee] = _balances[denylistee] & ~(uint256(1) << 255)`
12. Checking if an address if denylisted is simply seeing if the highest bit of their balance is 1: `_balances[account] >> 255 == 1`
13. Destroying the balance of a denylisted address is simply: `_balances[denylistee] = uint256(1) << 255` and reducing their prev balanceOf from the totalSupply.

**Pros:**

1. Checking addresses against the denylist by going the conventional route and checking against a mapping is costly. eg. in the case of `transferFrom`, we need to check three addresses against the denylist. This would mean three cold reads and a total of 6300 gas. Instead reusing the already loaded balance and checking the highest bit is cheaper. Over time gas savings will be substantial.

**Cons:**

1. It is more complicated from an implementation perspective. One could argue that it’s worth it to go simple and just use a mapping and focus on safety and not over optimise on gas.

# Misc

## Slot layout

You can find the slot layout here:

[https://docs.google.com/spreadsheets/d/1HWYPuUbp1QOYOCSvoJXUHk0SoTsbDi5irdNibdNui8A/edit#gid=1069602549](https://docs.google.com/spreadsheets/d/1HWYPuUbp1QOYOCSvoJXUHk0SoTsbDi5irdNibdNui8A/edit#gid=1069602549)

Please use the `Using balance high bit` sheet and not the `Using boolean map` sheet.

## Alternate designs

1. The initial design used a simple denylisted mapping of address ⇒ boolean, i.e. `mapping(address ⇒ bool)`, and checked if an address was denylisted by simply seeing if the address was set to true in the mapping. This is very nice and simple from an implementation perspective. But it is a lot more costly from a gas perspective. eg. for a simple `transfer`, it involves looking up two addresses. 2 cold reads would be 4200 gas extra. But in the current design, because the high bit of the balances of the respective addresses indicate if the address is denylisted we can save the cost of checking for denylisting. The balances for these two addresses have to be read anyway to change them during a transfer.
2. The `whenNotDenylisted` modifier is only used in methods where the balance of the addresses to be checked are not being read anyway. eg. in `approve` calls. But in methods where the balances have to be read anyway like `transfer` we inline the check by calling `_requireBalanceIsNotDenylisted(balance)` to save some gas which the modifier version would cause due to a hot read.

## Standard ERC20 methods

| Method                                                 | Visibility | Revert if paused | Revert if address involved denylisted |
| ------------------------------------------------------ | ---------- | ---------------- | ------------------------------------- |
| name()                                                 | public     |                  |                                       |
| symbol                                                 | public     |                  |                                       |
| decimals()                                             | public     |                  |                                       |
| totalSupply()                                          | public     |                  |                                       |
| balanceOf()                                            | public     |                  |                                       |
| transfer(address to, uint256 amount)                   | public     | ✅               | ✅                                    |
| allowance(address owner, address spender)              | public     |                  |                                       |
| approve(address spender, uint256 amount)               | public     | ✅               | ✅                                    |
| transferFrom(address from, address to, uint256 amount) | public     | ✅               | ✅                                    |

## Non ERC20 methods

| Method                                                         | Visibility | Revert if paused | Revert if address involved denylisted         |
| -------------------------------------------------------------- | ---------- | ---------------- | --------------------------------------------- |
| increaseAllowance(address spender, uint256 addedValue)         | public     | ✅               | ✅                                            |
| decreaseAllowance(address spender, uint256 subtractedValue)    | public     | ✅               | ✅                                            |
| paused()                                                       | public     |                  |                                               |
| isDenylisted(address denylistee)                               | public     |                  |                                               |
| supportsInterface(bytes4 interfaceId)                          | public     |                  |                                               |
| hasRole(bytes32 role, address account)                         | public     |                  |                                               |
| getRoleAdmin(bytes32 role)                                     | public     |                  |                                               |
| grantRole(bytes32 role, address account)                       | public     |                  |                                               |
| revokeRole(bytes32 role, address account)                      | public     |                  |                                               |
| renounceRole(bytes32 role, address account)                    | public     |                  |                                               |
| proxiableUUID()                                                | external   |                  |                                               |
| upgradeTo(address newImplementation)                           | external   |                  |                                               |
| upgradeToAndCall(address newImplementation, bytes memory data) | external   |                  |                                               |
| pause()                                                        | external   | ✅               |                                               |
| unpause()                                                      | external   |                  |                                               |
| denylist(address denylistee)                                   | external   |                  | ✅ (only if denylistee is already denylisted) |
| undenylist(address denylistee)                                 | external   |                  |                                               |
| mint(address to, uint256 amount)                               | external   | ✅               | ✅                                            |
| burn(uint256 amount)                                           | external   | ✅               | ✅                                            |
| destroyDenylistedFunds(address denylistee)                     | external   |                  | Will revert if denylistee isn’t denylisted    |
