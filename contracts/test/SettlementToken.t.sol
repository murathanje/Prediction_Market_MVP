// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/SettlementToken.sol";

contract SettlementTokenTest is Test {
    SettlementToken public token;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        token = new SettlementToken();
    }

    function testInitialState() public view {
        assertEq(token.name(), "Prediction Market Token");
        assertEq(token.symbol(), "PMT");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 0);
        assertEq(token.owner(), owner);
    }

    function testMint() public {
        uint256 amount = 1000 * 10**18;
        
        token.mint(user1, amount);
        
        assertEq(token.balanceOf(user1), amount);
        assertEq(token.totalSupply(), amount);
    }

    function testMintMultipleUsers() public {
        uint256 amount1 = 1000 * 10**18;
        uint256 amount2 = 500 * 10**18;
        
        token.mint(user1, amount1);
        token.mint(user2, amount2);
        
        assertEq(token.balanceOf(user1), amount1);
        assertEq(token.balanceOf(user2), amount2);
        assertEq(token.totalSupply(), amount1 + amount2);
    }

    function testMintOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, 1000 * 10**18);
    }

    function testTransfer() public {
        uint256 amount = 1000 * 10**18;
        token.mint(user1, amount);
        
        vm.prank(user1);
        token.transfer(user2, 500 * 10**18);
        
        assertEq(token.balanceOf(user1), 500 * 10**18);
        assertEq(token.balanceOf(user2), 500 * 10**18);
    }

    function testApproveAndTransferFrom() public {
        uint256 amount = 1000 * 10**18;
        token.mint(user1, amount);
        
        vm.prank(user1);
        token.approve(user2, 500 * 10**18);
        
        vm.prank(user2);
        token.transferFrom(user1, user2, 500 * 10**18);
        
        assertEq(token.balanceOf(user1), 500 * 10**18);
        assertEq(token.balanceOf(user2), 500 * 10**18);
    }

    function testFuzzMint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(amount <= type(uint256).max / 2);
        
        token.mint(to, amount);
        assertEq(token.balanceOf(to), amount);
    }
}
