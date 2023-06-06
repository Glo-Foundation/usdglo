pragma solidity 0.8.7;

import "forge-std/Test.sol";
import "../../contracts/v3/USDGLO_V3.sol";
import "./Helper.sol";

contract USDGLO_Fork_Test is Test {
    GloDollarV3 private usdglo;

    address private constant admin =
        address(0x284797b8dA4909755FCA06Fa02BF81c0dae9a0E3);
    address private constant minter =
        address(0x18216283a5045E8719D0F8B3617Ab6B14fC4d479);
    address private constant denylister =
        address(0x1135A985908639b5a218B351d16A61e084CFF7a1);
    address private constant pauser =
        address(0xeBE0ef4cF72e9ACf37F4337355b56427a09C8F89);

    uint256 private constant MAX_ALLOWED_SUPPLY = (uint256(1) << 255) - 1;

    function setUp() public {
        UUPSProxy proxy = UUPSProxy(
            payable(0x4F604735c1cF31399C6E711D5962b2B3E0225AD3)
        );

        // wrap in ABI to support easier calls
        usdglo = GloDollarV3(address(proxy));
    }

    /// forge-config: default.fuzz.runs = 256
    function testMint(address from, uint256 amount) public {
        amount = bound(amount, 0, MAX_ALLOWED_SUPPLY);
        uint256 beforeSupply = usdglo.totalSupply();
        uint256 beforeBalance = usdglo.balanceOf(from);
        vm.startPrank(minter);

        if (from == address(0)) {
            vm.expectRevert(bytes("ERC20: mint to the zero address"));

            usdglo.mint(from, amount);
        } else if (amount >= MAX_ALLOWED_SUPPLY - beforeSupply) {
            bytes4 selector = bytes4(keccak256("IsOverSupplyCap(uint256)"));
            vm.expectRevert(
                abi.encodeWithSelector(selector, usdglo.totalSupply() + amount)
            );

            usdglo.mint(from, amount);
        } else {
            usdglo.mint(from, amount);

            assertEq(usdglo.totalSupply(), beforeSupply + amount);
            assertEq(usdglo.balanceOf(from), beforeBalance + amount);
        }

        vm.stopPrank();
    }

    /// forge-config: default.fuzz.runs = 256
    function testBurn(uint256 mintAmount, uint256 burnAmount) public {
        uint256 beforeSupply = usdglo.totalSupply();
        uint256 beforeBalance = usdglo.balanceOf(minter);
        mintAmount = bound(mintAmount, 0, MAX_ALLOWED_SUPPLY - beforeSupply);

        vm.startPrank(minter);

        usdglo.mint(minter, mintAmount);

        if (burnAmount > beforeBalance + mintAmount) {
            vm.expectRevert(bytes("ERC20: burn amount exceeds balance"));

            usdglo.burn(burnAmount);
        } else {
            usdglo.burn(burnAmount);

            assertEq(
                usdglo.totalSupply(),
                beforeSupply + mintAmount - burnAmount
            );
            assertEq(
                usdglo.balanceOf(minter),
                beforeBalance + mintAmount - burnAmount
            );
        }

        vm.stopPrank();
    }

    /// forge-config: default.fuzz.runs = 256
    function testApprove(address to, uint256 amount) public {
        if (to == address(0)) {
            vm.expectRevert(bytes("ERC20: approve to the zero address"));

            bool success = usdglo.approve(to, amount);

            assertFalse(success);
            assertEq(usdglo.allowance(address(this), to), 0);
        } else {
            bool success = usdglo.approve(to, amount);

            assertTrue(success);
            assertEq(usdglo.allowance(address(this), to), amount);
        }
    }

    /// forge-config: default.fuzz.runs = 256
    function testTransfer(
        address from,
        address to,
        uint256 initialBalance,
        uint256 amount
    ) public {
        uint256 beforeSupply = usdglo.totalSupply();
        uint256 fromBeforeBalance = usdglo.balanceOf(from);
        uint256 toBeforeBalance = usdglo.balanceOf(to);

        vm.assume(from != address(0));
        initialBalance = bound(
            initialBalance,
            0,
            MAX_ALLOWED_SUPPLY - beforeSupply
        );
        amount = bound(amount, 0, initialBalance);

        vm.prank(minter);
        usdglo.mint(from, initialBalance);

        if (to == address(0)) {
            vm.expectRevert(bytes("ERC20: transfer to the zero address"));

            vm.prank(from);
            bool success = usdglo.transfer(to, amount);

            assertFalse(success);
            assertEq(usdglo.totalSupply(), beforeSupply + initialBalance);
            assertEq(
                usdglo.balanceOf(from),
                fromBeforeBalance + initialBalance
            );
            assertEq(usdglo.balanceOf(to), toBeforeBalance);
        } else {
            vm.prank(from);
            bool success = usdglo.transfer(to, amount);

            assertTrue(success);
            assertEq(usdglo.totalSupply(), beforeSupply + initialBalance);

            if (from == to) {
                assertEq(
                    usdglo.balanceOf(from),
                    fromBeforeBalance + initialBalance
                );
            } else {
                assertEq(
                    usdglo.balanceOf(from),
                    fromBeforeBalance + initialBalance - amount
                );
                assertEq(usdglo.balanceOf(to), toBeforeBalance + amount);
            }
        }
    }

    /// forge-config: default.fuzz.runs = 256
    function testTransferFrom(
        address sender,
        address from,
        address to,
        uint256 approval,
        uint256 amount
    ) public {
        uint256 beforeSupply = usdglo.totalSupply();
        uint256 fromBeforeBalance = usdglo.balanceOf(from);
        uint256 toBeforeBalance = usdglo.balanceOf(to);
        uint256 beforeApproval = usdglo.allowance(from, sender);

        vm.assume(sender != address(0));
        vm.assume(from != address(0));
        amount = bound(
            amount,
            0,
            approval < MAX_ALLOWED_SUPPLY - beforeSupply
                ? approval
                : MAX_ALLOWED_SUPPLY - beforeSupply
        );

        vm.prank(minter);
        usdglo.mint(from, amount);

        vm.prank(from);
        usdglo.approve(sender, approval);

        if (to == address(0)) {
            vm.expectRevert(bytes("ERC20: transfer to the zero address"));

            vm.prank(sender);
            bool success = usdglo.transferFrom(from, to, amount);

            assertFalse(success);
            assertEq(usdglo.totalSupply(), beforeSupply + amount);
            assertEq(usdglo.balanceOf(from), fromBeforeBalance + amount);
            assertEq(usdglo.balanceOf(to), toBeforeBalance);
        } else {
            vm.prank(sender);
            bool success = usdglo.transferFrom(from, to, amount);

            assertTrue(success);
            assertEq(usdglo.totalSupply(), beforeSupply + amount);

            if (approval == type(uint256).max) {
                assertEq(usdglo.allowance(from, sender), approval);
            } else {
                assertEq(
                    usdglo.allowance(from, sender),
                    beforeApproval + approval - amount
                );
            }

            if (from == to) {
                assertEq(usdglo.balanceOf(from), fromBeforeBalance + amount);
            } else {
                assertEq(usdglo.balanceOf(from), fromBeforeBalance);
                assertEq(usdglo.balanceOf(to), toBeforeBalance + amount);
            }
        }
    }

    /// forge-config: default.fuzz.runs = 256
    function testBurnInsufficientBalance(uint256 mintAmount, uint256 burnAmount)
        public
    {
        uint256 beforeSupply = usdglo.totalSupply();
        uint256 beforeBalance = usdglo.balanceOf(minter);

        mintAmount = bound(mintAmount, 0, MAX_ALLOWED_SUPPLY - beforeSupply);
        burnAmount = bound(
            burnAmount,
            mintAmount + beforeBalance + 1,
            type(uint256).max
        );

        vm.startPrank(minter);

        usdglo.mint(minter, mintAmount);

        vm.expectRevert(bytes("ERC20: burn amount exceeds balance"));
        usdglo.burn(burnAmount);

        vm.stopPrank();
    }

    /// forge-config: default.fuzz.runs = 256
    function testTransferInsufficientBalance(
        address to,
        uint256 mintAmount,
        uint256 sendAmount
    ) public {
        uint256 beforeSupply = usdglo.totalSupply();
        uint256 beforeBalance = usdglo.balanceOf(minter);

        vm.assume(to != address(0));
        mintAmount = bound(mintAmount, 0, MAX_ALLOWED_SUPPLY - beforeSupply);
        sendAmount = bound(
            sendAmount,
            mintAmount + beforeBalance + 1,
            type(uint256).max
        );

        vm.prank(minter);
        usdglo.mint(address(this), mintAmount);

        vm.expectRevert(bytes("ERC20: transfer amount exceeds balance"));
        usdglo.transfer(to, sendAmount);
    }

    /// forge-config: default.fuzz.runs = 256
    function testTransferFromInsufficientAllowance(
        address to,
        uint256 approval,
        uint256 amount
    ) public {
        uint256 beforeSupply = usdglo.totalSupply();

        approval = bound(approval, 0, MAX_ALLOWED_SUPPLY - beforeSupply - 1);
        amount = bound(amount, approval + 1, MAX_ALLOWED_SUPPLY - beforeSupply);

        address from = address(0xABCD);

        vm.prank(minter);
        usdglo.mint(from, amount);

        vm.prank(from);
        usdglo.approve(address(this), approval);

        vm.expectRevert(bytes("ERC20: insufficient allowance"));
        usdglo.transferFrom(from, to, amount);
    }

    /// forge-config: default.fuzz.runs = 256
    function testTransferFromInsufficientBalance(
        address to,
        uint256 mintAmount,
        uint256 sendAmount
    ) public {
        uint256 beforeSupply = usdglo.totalSupply();

        vm.assume(to != address(0));
        mintAmount = bound(mintAmount, 0, MAX_ALLOWED_SUPPLY - beforeSupply);
        sendAmount = bound(sendAmount, mintAmount + 1, type(uint256).max);

        address from = address(0xABCD);

        vm.prank(minter);
        usdglo.mint(from, mintAmount);

        vm.prank(from);
        usdglo.approve(address(this), sendAmount);

        vm.expectRevert(bytes("ERC20: transfer amount exceeds balance"));
        usdglo.transferFrom(from, to, sendAmount);
    }
}
