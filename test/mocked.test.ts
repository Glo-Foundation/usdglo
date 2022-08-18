import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployMockUSDGLOFixture } from "./fixtures";
import { ethers } from "hardhat";

import { MINTER_ROLE } from "./utils";

describe("other functionality of USDGLO", function () {
  describe("misc behaviour", function () {
    it("reverts burn if burner is zero address", async function () {
      const { admin, usdglo } = await loadFixture(deployMockUSDGLOFixture);

      await usdglo
        .connect(admin)
        .grantRole(MINTER_ROLE, ethers.constants.AddressZero);

      usdglo.setMockedOwner(ethers.constants.AddressZero);
      usdglo.setUseMockedOwner(true);

      await expect(usdglo.connect(admin).burn(1)).to.be.revertedWith(
        "ERC20: burn from the zero address"
      );
    });
  });

  it("reverts transfer if sender is zero address", async function () {
    const { admin, usdglo } = await loadFixture(deployMockUSDGLOFixture);

    const amount = 100_000;

    usdglo.setMockedOwner(ethers.constants.AddressZero);
    usdglo.setUseMockedOwner(true);

    await expect(
      usdglo.connect(admin).transfer(admin.address, amount)
    ).to.be.revertedWith("ERC20: transfer from the zero address");
  });

  it("reverts approve if owner is zero address", async function () {
    const { admin, usdglo } = await loadFixture(deployMockUSDGLOFixture);

    const amount = 100_000;

    usdglo.setMockedOwner(ethers.constants.AddressZero);
    usdglo.setUseMockedOwner(true);

    await expect(
      usdglo.connect(admin).approve(admin.address, amount)
    ).to.be.revertedWith("ERC20: approve from the zero address");
  });
});
