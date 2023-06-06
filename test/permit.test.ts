// Ported from: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/extensions/draft-ERC20Permit.test.js

import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers } from "hardhat";
import { getPermitSignature } from "./utils";
import { BigNumber } from "ethers";

describe("permit functionality of USDGLO", function () {
  describe("initial state", function () {
    it("initial nonce is 0", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1] = await ethers.getSigners();

      expect(await usdglo.nonces(user1.address)).to.equal(0);
    });

    it("domain separator", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);

      const typeHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        )
      );
      const nameHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("Glo Dollar")
      );
      const versionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1"));
      const chainId = usdglo.provider.network.chainId;
      const expectedDomainSeperator = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["bytes32", "bytes32", "bytes32", "uint256", "address"],
          [typeHash, nameHash, versionHash, chainId, usdglo.address]
        )
      );
      expect(await usdglo.DOMAIN_SEPARATOR()).to.equal(expectedDomainSeperator);
    });
  });

  describe("permit", function () {
    it("accepts owner signature", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, owner, spender] = await ethers.getSigners();

      const value = 100_000;
      const deadline = ethers.constants.MaxInt256;

      const { v, r, s } = await getPermitSignature(
        owner,
        usdglo,
        spender.address,
        value,
        deadline
      );

      await usdglo.permit(
        owner.address,
        spender.address,
        value,
        deadline,
        v,
        r,
        s
      );

      expect(await usdglo.nonces(owner.address)).to.equal(1);
      expect(await usdglo.allowance(owner.address, spender.address)).to.equal(
        value
      );
    });

    it("rejects reused signature", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, owner, spender] = await ethers.getSigners();

      const value = 100_000;
      const deadline = ethers.constants.MaxInt256;

      const { v, r, s } = await getPermitSignature(
        owner,
        usdglo,
        spender.address,
        value,
        deadline
      );

      await usdglo.permit(
        owner.address,
        spender.address,
        value,
        deadline,
        v,
        r,
        s
      );

      expect(await usdglo.nonces(owner.address)).to.equal(1);
      expect(await usdglo.allowance(owner.address, spender.address)).to.equal(
        value
      );

      await expect(
        usdglo.permit(owner.address, spender.address, value, deadline, v, r, s)
      ).to.be.revertedWith("ERC20Permit: invalid signature");
    });

    it("rejects other signature", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, owner, spender] = await ethers.getSigners();

      const value = 100_000;
      const deadline = ethers.constants.MaxInt256;

      const { v, r, s } = await getPermitSignature(
        spender,
        usdglo,
        spender.address,
        value,
        deadline
      );

      await expect(
        usdglo.permit(owner.address, spender.address, value, deadline, v, r, s)
      ).to.be.revertedWith("ERC20Permit: invalid signature");
    });

    it("rejects expired permit", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, owner, spender] = await ethers.getSigners();

      const value = 100_000;
      const deadline = BigNumber.from(1);

      const { v, r, s } = await getPermitSignature(
        owner,
        usdglo,
        spender.address,
        value,
        deadline
      );

      await expect(
        usdglo.permit(owner.address, spender.address, value, deadline, v, r, s)
      ).to.be.revertedWith("ERC20Permit: expired deadline");
    });
  });
});
