import { utils, BigNumber, Contract, Signer } from "ethers";
import { ethers } from "hardhat";
import { BigNumberish, constants, Signature } from "ethers";
import { splitSignature } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

function getRoleKeccakFromRoleName(roleName: string) {
  return utils.keccak256(utils.toUtf8Bytes(roleName));
}

export function getAccessControlRevertMessage(
  roleName: string,
  address: string
) {
  const role = getRoleKeccakFromRoleName(roleName);
  return `AccessControl: account ${address.toLowerCase()} is missing role ${role}`;
}

export const MINTER_ROLE_NAME = "MINTER_ROLE";
export const PAUSER_ROLE_NAME = "PAUSER_ROLE";
export const DENYLISTER_ROLE_NAME = "DENYLISTER_ROLE";
export const UPGRADER_ROLE_NAME = "UPGRADER_ROLE";

export const MINTER_ROLE = getRoleKeccakFromRoleName(MINTER_ROLE_NAME);
export const PAUSER_ROLE = getRoleKeccakFromRoleName(PAUSER_ROLE_NAME);
export const DENYLISTER_ROLE = getRoleKeccakFromRoleName(DENYLISTER_ROLE_NAME);
export const UPGRADER_ROLE = getRoleKeccakFromRoleName(UPGRADER_ROLE_NAME);
export const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export async function readSlot(address: string, slot: any): Promise<string> {
  const value = await ethers.provider.getStorageAt(address, slot);
  return value;
}

export function getMappingSlot(address: string, slot: any, key: any): string {
  const paddedSlot = ethers.utils.hexZeroPad(slot, 32);
  const paddedKey = ethers.utils.hexZeroPad(key, 32);
  const itemSlot = ethers.utils.keccak256(paddedKey + paddedSlot.slice(2));
  return itemSlot;
}

export function getNestedMappingSlot(
  address: string,
  slot: any,
  parentKey: any,
  childKey: any
): string {
  const parentSlot = getMappingSlot(address, slot, parentKey);
  const childSlot = getMappingSlot(address, parentSlot, childKey);
  return childSlot;
}

export function parseString(hex: string): string {
  const len = parseInt(hex.slice(-2), 16);
  hex = hex.replace(/^0x/, "");
  return Buffer.from(hex.slice(0, len), "hex").toString("utf8");
}

export function parseUInt(hex: string): BigNumber {
  return BigNumber.from(hex);
}

export async function getPermitSignature(
  signer: SignerWithAddress,
  token: Contract,
  spender: string,
  value: BigNumberish | bigint = constants.MaxUint256,
  deadline = constants.MaxUint256,
  permitConfig?: {
    nonce?: BigNumberish;
    name?: string;
    chainId?: number;
    version?: string;
  }
): Promise<Signature> {
  const [nonce, name, version, chainId] = await Promise.all([
    permitConfig?.nonce ?? token.nonces(signer.address),
    permitConfig?.name ?? token.name(),
    permitConfig?.version ?? "1",
    permitConfig?.chainId ?? signer.getChainId(),
  ]);

  return splitSignature(
    await signer._signTypedData(
      {
        name,
        version,
        chainId,
        verifyingContract: token.address,
      },
      {
        Permit: [
          {
            name: "owner",
            type: "address",
          },
          {
            name: "spender",
            type: "address",
          },
          {
            name: "value",
            type: "uint256",
          },
          {
            name: "nonce",
            type: "uint256",
          },
          {
            name: "deadline",
            type: "uint256",
          },
        ],
      },
      {
        owner: signer.address,
        spender,
        value,
        nonce,
        deadline,
      }
    )
  );
}
