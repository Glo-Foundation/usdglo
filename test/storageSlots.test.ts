import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers } from "hardhat";
import {
  readSlot,
  getMappingSlot,
  getNestedMappingSlot,
  parseUInt,
  parseString,
  PAUSER_ROLE,
  DENYLISTER_ROLE,
  MINTER_ROLE,
} from "./utils";

function checkEmptySlots() {
  it("empty gap from ContextUpgradeable", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    for (let slot = 1; slot <= 50; slot++) {
      const slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);
    }
  });

  it("empty gap from ERC20Upgradeable", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    for (let slot = 56; slot <= 100; slot++) {
      const slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);
    }
  });

  it("empty gap from PausableUpgradeable", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    for (let slot = 102; slot <= 150; slot++) {
      const slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);
    }
  });

  it("empty gap from DenylistableUpgradeable", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    for (let slot = 152; slot <= 200; slot++) {
      const slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);
    }
  });

  it("empty gap from ERC165Upgradeable", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    for (let slot = 201; slot <= 250; slot++) {
      const slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);
    }
  });

  it("empty gap from AccessControlUpgradeable", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    for (let slot = 252; slot <= 300; slot++) {
      const slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);
    }
  });

  it("empty gap from ERC1967UpgradeUpgradeable", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    for (let slot = 301; slot <= 350; slot++) {
      const slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);
    }
  });

  it("empty gap from UUPSUpgradeable", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    for (let slot = 351; slot <= 400; slot++) {
      const slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);
    }
  });
}

function checkUnusedSlots() {
  it("bits 17 to 256 of slot 0 is unused", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    const slot = 0;
    const slotValue = await readSlot(usdglo.address, slot);
    const byte32Hex = ethers.utils.hexDataSlice(slotValue, 0, 30);
    expect(parseUInt(byte32Hex)).to.equal(0);
  });

  it("bits 9 to 256 of slot 101 is unused", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    const slot = 0;
    const slotValue = await readSlot(usdglo.address, slot);
    const byte32Hex = ethers.utils.hexDataSlice(slotValue, 0, 31);
    expect(parseUInt(byte32Hex)).to.equal(0);
  });
}

describe("storage slots of USDGLO", function () {
  describe("storage slots of empty gaps", checkEmptySlots);

  describe("storage slots with unused bits ", checkUnusedSlots);

  describe("storage slots of values that can change", function () {
    it("_initialized from Initializable is true", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const slot = 0;
      const slotValue = await readSlot(usdglo.address, slot);
      const byte32Hex = ethers.utils.hexDataSlice(slotValue, 31, 32);
      expect(parseUInt(byte32Hex)).to.equal(1);
    });

    it("_initializing from Initializable is false", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const slot = 0;
      const slotValue = await readSlot(usdglo.address, slot);
      const byte32Hex = ethers.utils.hexDataSlice(slotValue, 30, 31);
      expect(parseUInt(byte32Hex)).to.equal(0);
    });

    it("_balances mapping", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const slot = 51;
      await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);

      let slotValue = await readSlot(
        usdglo.address,
        getMappingSlot(usdglo.address, slot, admin.address)
      );
      expect(parseUInt(slotValue)).to.equal(0);

      await usdglo.connect(admin).mint(admin.address, 100_000);
      slotValue = await readSlot(
        usdglo.address,
        getMappingSlot(usdglo.address, slot, admin.address)
      );
      expect(parseUInt(slotValue)).to.equal(100_000);

      await usdglo.connect(admin).burn(50_000);
      slotValue = await readSlot(
        usdglo.address,
        getMappingSlot(usdglo.address, slot, admin.address)
      );
      expect(parseUInt(slotValue)).to.equal(50_000);
    });

    it("_allowances mapping", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const slot = 52;
      const [_, user] = await ethers.getSigners();

      let slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);

      slotValue = await readSlot(
        usdglo.address,
        getNestedMappingSlot(usdglo.address, slot, admin.address, user.address)
      );
      expect(parseUInt(slotValue)).to.equal(0);

      await usdglo.connect(admin).approve(user.address, 250_000);
      slotValue = await readSlot(
        usdglo.address,
        getNestedMappingSlot(usdglo.address, slot, admin.address, user.address)
      );
      expect(parseUInt(slotValue)).to.equal(250_000);

      await usdglo.connect(admin).increaseAllowance(user.address, 25_000);
      slotValue = await readSlot(
        usdglo.address,
        getNestedMappingSlot(usdglo.address, slot, admin.address, user.address)
      );
      expect(parseUInt(slotValue)).to.equal(275_000);

      await usdglo.connect(admin).decreaseAllowance(user.address, 250_000);
      slotValue = await readSlot(
        usdglo.address,
        getNestedMappingSlot(usdglo.address, slot, admin.address, user.address)
      );
      expect(parseUInt(slotValue)).to.equal(25_000);
    });

    it("0 _totalSupply", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const slot = 53;
      await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);

      let slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);

      await usdglo.connect(admin).mint(admin.address, 100_000);
      slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(100_000);

      await usdglo.connect(admin).burn(50_000);
      slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(50_000);
    });

    it("_name", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const slot = 54;
      const slotValue = await readSlot(usdglo.address, slot);
      expect(parseString(slotValue)).to.equal("USD Global Income Coin");
    });

    it("_symbol", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const slot = 55;
      const slotValue = await readSlot(usdglo.address, slot);
      expect(parseString(slotValue)).to.equal("USDGLO");
    });

    it("_paused from PausableUpgradeable", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const slot = 101;
      await usdglo.connect(admin).grantRole(PAUSER_ROLE, admin.address);

      let slotValue = await readSlot(usdglo.address, slot);
      let byte32Hex = ethers.utils.hexDataSlice(slotValue, 31, 32);
      expect(parseUInt(byte32Hex)).to.equal(0);

      await usdglo.connect(admin).pause();
      slotValue = await readSlot(usdglo.address, slot);
      byte32Hex = ethers.utils.hexDataSlice(slotValue, 31, 32);
      expect(parseUInt(byte32Hex)).to.equal(1);

      await usdglo.connect(admin).unpause();
      slotValue = await readSlot(usdglo.address, slot);
      byte32Hex = ethers.utils.hexDataSlice(slotValue, 31, 32);
      expect(parseUInt(byte32Hex)).to.equal(0);
    });

    it("denylisted mapping", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const slot = 151;
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, admin.address);
      const [_, user] = await ethers.getSigners();

      let slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);

      slotValue = await readSlot(
        usdglo.address,
        getMappingSlot(usdglo.address, slot, user.address)
      );
      expect(parseUInt(slotValue)).to.equal(0);

      await usdglo.connect(admin).denylist(user.address);
      slotValue = await readSlot(
        usdglo.address,
        getMappingSlot(usdglo.address, slot, user.address)
      );
      expect(parseUInt(slotValue)).to.equal(1);

      await usdglo.connect(admin).undenylist(user.address);
      slotValue = await readSlot(
        usdglo.address,
        getMappingSlot(usdglo.address, slot, user.address)
      );
      expect(parseUInt(slotValue)).to.equal(0);
    });

    it("_roles mapping", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const slot = 251;
      const [_, user] = await ethers.getSigners();

      let slotValue = await readSlot(usdglo.address, slot);
      expect(parseUInt(slotValue)).to.equal(0);

      slotValue = await readSlot(
        usdglo.address,
        getNestedMappingSlot(usdglo.address, slot, MINTER_ROLE, user.address)
      );
      expect(parseUInt(slotValue)).to.equal(0);

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user.address);
      slotValue = await readSlot(
        usdglo.address,
        getNestedMappingSlot(usdglo.address, slot, MINTER_ROLE, user.address)
      );
      expect(parseUInt(slotValue)).to.equal(1);

      await usdglo.connect(admin).revokeRole(MINTER_ROLE, user.address);
      slotValue = await readSlot(
        usdglo.address,
        getNestedMappingSlot(usdglo.address, slot, MINTER_ROLE, user.address)
      );
      expect(parseUInt(slotValue)).to.equal(0);
    });
  });
});
