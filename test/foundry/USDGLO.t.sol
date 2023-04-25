pragma solidity 0.8.7;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../../contracts/v2/USDGLO_V2.sol";

contract UUPSProxy is ERC1967Proxy {
    constructor(address _implementation, bytes memory _data)
        ERC1967Proxy(_implementation, _data)
    {}
}

contract ERC20Test is Test {
    USDGlobalIncomeCoinV2 private usdglo;

    address private constant admin = address(1);
    address private constant minter = address(2);

    uint256 private constant MAX_ALLOWED_SUPPLY = (uint256(1) << 255) - 1;

    function setUp() public {
        USDGlobalIncomeCoinV2 implementationV1 = new USDGlobalIncomeCoinV2();
        UUPSProxy proxy = new UUPSProxy(address(implementationV1), "");

        // wrap in ABI to support easier calls
        usdglo = USDGlobalIncomeCoinV2(address(proxy));

        usdglo.initialize(admin);

        vm.startPrank(admin);

        usdglo.grantRole(usdglo.MINTER_ROLE(), minter);

        vm.stopPrank();
    }

    function testMint(address from, uint256 amount) public {
        vm.startPrank(minter);

        if (from == address(0)) {
            vm.expectRevert(bytes("ERC20: mint to the zero address"));

            usdglo.mint(from, amount);
        } else if (amount >= MAX_ALLOWED_SUPPLY) {
            bytes4 selector = bytes4(keccak256("IsOverSupplyCap(uint256)"));
            vm.expectRevert(
                abi.encodeWithSelector(selector, usdglo.totalSupply() + amount)
            );

            usdglo.mint(from, amount);
        } else {
            usdglo.mint(from, amount);

            assertEq(usdglo.totalSupply(), amount);
            assertEq(usdglo.balanceOf(from), amount);
        }

        vm.stopPrank();
    }

    function testBurn(uint256 mintAmount, uint256 burnAmount) public {
        mintAmount = bound(mintAmount, 0, MAX_ALLOWED_SUPPLY);

        vm.startPrank(minter);

        usdglo.mint(minter, mintAmount);

        if (burnAmount > mintAmount) {
            vm.expectRevert(bytes("ERC20: burn amount exceeds balance"));

            usdglo.burn(burnAmount);
        } else {
            usdglo.burn(burnAmount);

            assertEq(usdglo.totalSupply(), mintAmount - burnAmount);
            assertEq(usdglo.balanceOf(minter), mintAmount - burnAmount);
        }

        vm.stopPrank();
    }

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

    function testTransfer(
        address from,
        address to,
        uint256 initialBalance,
        uint256 amount
    ) public {
        vm.assume(from != address(0));
        initialBalance = bound(initialBalance, 0, MAX_ALLOWED_SUPPLY);
        amount = bound(amount, 0, initialBalance);

        vm.prank(minter);
        usdglo.mint(from, initialBalance);

        if (to == address(0)) {
            vm.expectRevert(bytes("ERC20: transfer to the zero address"));

            vm.prank(from);
            bool success = usdglo.transfer(to, amount);

            assertFalse(success);
            assertEq(usdglo.totalSupply(), initialBalance);
            assertEq(usdglo.balanceOf(from), initialBalance);
            assertEq(usdglo.balanceOf(to), 0);
        } else {
            vm.prank(from);
            bool success = usdglo.transfer(to, amount);

            assertTrue(success);
            assertEq(usdglo.totalSupply(), initialBalance);

            if (from == to) {
                assertEq(usdglo.balanceOf(from), initialBalance);
            } else {
                assertEq(usdglo.balanceOf(from), initialBalance - amount);
                assertEq(usdglo.balanceOf(to), amount);
            }
        }
    }

    function testTransferFrom(
        address sender,
        address from,
        address to,
        uint256 approval,
        uint256 amount
    ) public {
        vm.assume(sender != address(0));
        vm.assume(from != address(0));
        amount = bound(
            amount,
            0,
            approval < MAX_ALLOWED_SUPPLY ? approval : MAX_ALLOWED_SUPPLY
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
            assertEq(usdglo.totalSupply(), amount);
            assertEq(usdglo.balanceOf(from), amount);
            assertEq(usdglo.balanceOf(to), 0);
        } else {
            vm.prank(sender);
            bool success = usdglo.transferFrom(from, to, amount);

            assertTrue(success);
            assertEq(usdglo.totalSupply(), amount);

            if (approval == type(uint256).max) {
                assertEq(usdglo.allowance(from, sender), approval);
            } else {
                assertEq(usdglo.allowance(from, sender), approval - amount);
            }

            if (from == to) {
                assertEq(usdglo.balanceOf(from), amount);
            } else {
                assertEq(usdglo.balanceOf(from), 0);
                assertEq(usdglo.balanceOf(to), amount);
            }
        }
    }

    function testBurnInsufficientBalance(uint256 mintAmount, uint256 burnAmount)
        public
    {
        mintAmount = bound(mintAmount, 0, MAX_ALLOWED_SUPPLY);
        burnAmount = bound(burnAmount, mintAmount + 1, type(uint256).max);

        vm.startPrank(minter);

        usdglo.mint(minter, mintAmount);

        vm.expectRevert(bytes("ERC20: burn amount exceeds balance"));
        usdglo.burn(burnAmount);

        vm.stopPrank();
    }

    function testTransferInsufficientBalance(
        address to,
        uint256 mintAmount,
        uint256 sendAmount
    ) public {
        vm.assume(to != address(0));
        mintAmount = bound(mintAmount, 0, MAX_ALLOWED_SUPPLY);
        sendAmount = bound(sendAmount, mintAmount + 1, type(uint256).max);

        vm.prank(minter);
        usdglo.mint(address(this), mintAmount);

        vm.expectRevert(bytes("ERC20: transfer amount exceeds balance"));
        usdglo.transfer(to, sendAmount);
    }

    function testTransferFromInsufficientAllowance(
        address to,
        uint256 approval,
        uint256 amount
    ) public {
        approval = bound(approval, 0, MAX_ALLOWED_SUPPLY - 1);
        amount = bound(amount, approval + 1, MAX_ALLOWED_SUPPLY);

        address from = address(0xABCD);

        vm.prank(minter);
        usdglo.mint(from, amount);

        vm.prank(from);
        usdglo.approve(address(this), approval);

        vm.expectRevert(bytes("ERC20: insufficient allowance"));
        usdglo.transferFrom(from, to, amount);
    }

    function testTransferFromInsufficientBalance(
        address to,
        uint256 mintAmount,
        uint256 sendAmount
    ) public {
        vm.assume(to != address(0));
        mintAmount = bound(mintAmount, 0, MAX_ALLOWED_SUPPLY);
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
