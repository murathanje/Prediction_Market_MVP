// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/PredictionMarket.sol";
import "../src/MarketFactory.sol";
import "../src/SettlementToken.sol";

contract PredictionMarketTest is Test {
    PredictionMarket public market;
    SettlementToken public token;
    MarketFactory public factory;
    
    address public owner;
    address public resolver;
    address public user1;
    address public user2;
    address public user3;

    uint256 constant INITIAL_LIQUIDITY = 10 * 10**18;
    uint256 constant MARKET_DURATION = 7 days;

    function setUp() public {
        owner = address(this);
        resolver = makeAddr("resolver");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");

        token = new SettlementToken();
        factory = new MarketFactory(address(token));
        
        token.mint(resolver, 1000 * 10**18);
        token.mint(user1, 1000 * 10**18);
        token.mint(user2, 1000 * 10**18);
        token.mint(user3, 1000 * 10**18);

        vm.startPrank(resolver);
        token.approve(address(factory), type(uint256).max);
        address marketAddress = factory.createMarket(
            "Will ETH reach $5000 by end of year?",
            block.timestamp + MARKET_DURATION,
            INITIAL_LIQUIDITY
        );
        vm.stopPrank();

        market = PredictionMarket(marketAddress);
    }

    function testInitialState() public view {
        (
            string memory question,
            uint256 endTime,
            uint256 yesPool,
            uint256 noPool,
            uint256 totalYesShares,
            uint256 totalNoShares,
            PredictionMarket.MarketStatus status,
            bool outcome,
            address marketResolver
        ) = market.marketInfo();

        assertEq(question, "Will ETH reach $5000 by end of year?");
        assertEq(endTime, block.timestamp + MARKET_DURATION);
        assertEq(yesPool, INITIAL_LIQUIDITY / 2);
        assertEq(noPool, INITIAL_LIQUIDITY / 2);
        assertEq(totalYesShares, 0);
        assertEq(totalNoShares, 0);
        assertTrue(status == PredictionMarket.MarketStatus.CREATED);
        assertEq(outcome, false);
        assertEq(marketResolver, resolver);
    }

    function testBuyYesPosition() public {
        uint256 betAmount = 10 * 10**18;
        
        vm.startPrank(user1);
        token.approve(address(market), betAmount);
        market.buyPosition(true, betAmount);
        vm.stopPrank();

        (uint256 yesShares, uint256 noShares) = market.getUserPosition(user1);
        assertGt(yesShares, 0);
        assertEq(noShares, 0);
    }

    function testBuyNoPosition() public {
        uint256 betAmount = 10 * 10**18;
        
        vm.startPrank(user2);
        token.approve(address(market), betAmount);
        market.buyPosition(false, betAmount);
        vm.stopPrank();

        (uint256 yesShares, uint256 noShares) = market.getUserPosition(user2);
        assertEq(yesShares, 0);
        assertGt(noShares, 0);
    }

    function testMultipleBets() public {
        uint256 bet1 = 10 * 10**18;
        uint256 bet2 = 20 * 10**18;
        uint256 bet3 = 15 * 10**18;

        vm.startPrank(user1);
        token.approve(address(market), bet1);
        market.buyPosition(true, bet1);
        vm.stopPrank();

        vm.startPrank(user2);
        token.approve(address(market), bet2);
        market.buyPosition(false, bet2);
        vm.stopPrank();

        vm.startPrank(user3);
        token.approve(address(market), bet3);
        market.buyPosition(true, bet3);
        vm.stopPrank();

        (uint256 user1Yes, ) = market.getUserPosition(user1);
        (uint256 user3Yes, ) = market.getUserPosition(user3);
        ( , uint256 user2No) = market.getUserPosition(user2);

        assertGt(user1Yes, 0);
        assertGt(user2No, 0);
        assertGt(user3Yes, 0);
    }

    function testCannotBetAfterMarketEnds() public {
        vm.warp(block.timestamp + MARKET_DURATION + 1);

        vm.startPrank(user1);
        token.approve(address(market), 10 * 10**18);
        vm.expectRevert(PredictionMarket.MarketEnded.selector);
        market.buyPosition(true, 10 * 10**18);
        vm.stopPrank();
    }

    function testCannotBetBelowMinimum() public {
        vm.startPrank(user1);
        token.approve(address(market), 1e14);
        vm.expectRevert(PredictionMarket.InsufficientAmount.selector);
        market.buyPosition(true, 1e14);
        vm.stopPrank();
    }

    function testResolveMarket() public {
        vm.prank(resolver);
        market.resolveMarket(true);

        ( , , , , , , PredictionMarket.MarketStatus status, bool outcome, ) = market.marketInfo();
        assertTrue(status == PredictionMarket.MarketStatus.RESOLVED);
        assertTrue(outcome);
    }

    function testOnlyResolverCanResolve() public {
        vm.prank(user1);
        vm.expectRevert(PredictionMarket.UnauthorizedResolver.selector);
        market.resolveMarket(true);
    }

    function testCannotResolveAgain() public {
        vm.prank(resolver);
        market.resolveMarket(true);

        vm.prank(resolver);
        vm.expectRevert(PredictionMarket.MarketAlreadyResolved.selector);
        market.resolveMarket(false);
    }

    function testClaimWinnings() public {
        uint256 bet1 = 100 * 10**18;
        uint256 bet2 = 50 * 10**18;

        vm.startPrank(user1);
        token.approve(address(market), bet1);
        market.buyPosition(true, bet1);
        vm.stopPrank();

        vm.startPrank(user2);
        token.approve(address(market), bet2);
        market.buyPosition(false, bet2);
        vm.stopPrank();

        vm.prank(resolver);
        market.resolveMarket(true);

        uint256 balanceBefore = token.balanceOf(user1);
        
        vm.prank(user1);
        market.claimWinnings();

        uint256 balanceAfter = token.balanceOf(user1);
        assertGt(balanceAfter, balanceBefore);
    }

    function testLoserGetsNothing() public {
        uint256 bet1 = 100 * 10**18;
        uint256 bet2 = 50 * 10**18;

        vm.startPrank(user1);
        token.approve(address(market), bet1);
        market.buyPosition(true, bet1);
        vm.stopPrank();

        vm.startPrank(user2);
        token.approve(address(market), bet2);
        market.buyPosition(false, bet2);
        vm.stopPrank();

        vm.prank(resolver);
        market.resolveMarket(true);

        vm.prank(user2);
        vm.expectRevert(PredictionMarket.NoWinningsToClaim.selector);
        market.claimWinnings();
    }

    function testCannotClaimBeforeResolution() public {
        uint256 bet = 10 * 10**18;

        vm.startPrank(user1);
        token.approve(address(market), bet);
        market.buyPosition(true, bet);
        
        vm.expectRevert(PredictionMarket.MarketNotResolved.selector);
        market.claimWinnings();
        vm.stopPrank();
    }

    function testCannotClaimTwice() public {
        uint256 bet = 100 * 10**18;

        vm.startPrank(user1);
        token.approve(address(market), bet);
        market.buyPosition(true, bet);
        vm.stopPrank();

        vm.prank(resolver);
        market.resolveMarket(true);

        vm.startPrank(user1);
        market.claimWinnings();
        
        vm.expectRevert(PredictionMarket.AlreadyClaimed.selector);
        market.claimWinnings();
        vm.stopPrank();
    }

    function testInvalidMarketRefunds() public {
        uint256 bet1 = 100 * 10**18;
        uint256 bet2 = 50 * 10**18;

        vm.startPrank(user1);
        token.approve(address(market), bet1);
        market.buyPosition(true, bet1);
        vm.stopPrank();

        vm.startPrank(user2);
        token.approve(address(market), bet2);
        market.buyPosition(false, bet2);
        vm.stopPrank();

        vm.prank(resolver);
        market.resolveAsInvalid();

        uint256 user1Before = token.balanceOf(user1);
        uint256 user2Before = token.balanceOf(user2);

        vm.prank(user1);
        market.claimWinnings();

        vm.prank(user2);
        market.claimWinnings();

        assertGt(token.balanceOf(user1), user1Before);
        assertGt(token.balanceOf(user2), user2Before);
    }

    function testGetPrice() public {
        uint256 initialPrice = market.getPrice(true);
        assertEq(initialPrice, 5000);

        vm.startPrank(user1);
        token.approve(address(market), 100 * 10**18);
        market.buyPosition(true, 100 * 10**18);
        vm.stopPrank();

        uint256 newYesPrice = market.getPrice(true);
        uint256 newNoPrice = market.getPrice(false);

        assertGt(newYesPrice, initialPrice);
        assertLt(newNoPrice, initialPrice);
        assertApproxEqAbs(newYesPrice + newNoPrice, 10000, 1);
    }

    function testTransferResolver() public {
        address newResolver = makeAddr("newResolver");

        vm.prank(resolver);
        market.transferResolver(newResolver);

        ( , , , , , , , , address currentResolver) = market.marketInfo();
        assertEq(currentResolver, newResolver);
    }

    function testOnlyResolverCanTransfer() public {
        address newResolver = makeAddr("newResolver");

        vm.prank(user1);
        vm.expectRevert(PredictionMarket.UnauthorizedResolver.selector);
        market.transferResolver(newResolver);
    }

    function testPause() public {
        vm.prank(address(factory));
        market.pause();

        vm.startPrank(user1);
        token.approve(address(market), 10 * 10**18);
        vm.expectRevert();
        market.buyPosition(true, 10 * 10**18);
        vm.stopPrank();
    }

    function testFuzzBuyPosition(uint256 amount) public {
        amount = bound(amount, market.MIN_BET_AMOUNT(), 100 * 10**18);
        
        vm.startPrank(user1);
        token.approve(address(market), amount);
        market.buyPosition(true, amount);
        vm.stopPrank();

        (uint256 yesShares, ) = market.getUserPosition(user1);
        assertGt(yesShares, 0);
    }
}
