// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/MarketFactory.sol";
import "../src/PredictionMarket.sol";
import "../src/SettlementToken.sol";

contract MarketFactoryTest is Test {
    MarketFactory public factory;
    SettlementToken public token;
    
    address public owner;
    address public user1;
    address public user2;

    uint256 constant INITIAL_LIQUIDITY = 10 * 10**18;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        token = new SettlementToken();
        factory = new MarketFactory(address(token));

        token.mint(user1, 1000 * 10**18);
        token.mint(user2, 1000 * 10**18);
    }

    function testInitialState() public view {
        assertEq(address(factory.settlementToken()), address(token));
        assertEq(factory.owner(), owner);
        assertEq(factory.getMarketsCount(), 0);
        assertEq(factory.minMarketDuration(), 1 hours);
        assertEq(factory.maxMarketDuration(), 365 days);
        assertEq(factory.minInitialLiquidity(), 1e18);
        assertEq(factory.marketCreationFee(), 0);
    }

    function testCreateMarket() public {
        string memory question = "Will BTC reach $100k?";
        uint256 endTime = block.timestamp + 7 days;

        vm.startPrank(user1);
        token.approve(address(factory), type(uint256).max);
        address marketAddress = factory.createMarket(question, endTime, INITIAL_LIQUIDITY);
        vm.stopPrank();

        assertTrue(marketAddress != address(0));
        assertTrue(factory.isMarket(marketAddress));
        assertEq(factory.getMarketsCount(), 1);
        assertEq(factory.getMarket(0), marketAddress);
    }

    function testCreateMultipleMarkets() public {
        vm.startPrank(user1);
        token.approve(address(factory), 1000 * 10**18);
        
        address market1 = factory.createMarket(
            "Market 1",
            block.timestamp + 7 days,
            INITIAL_LIQUIDITY
        );
        address market2 = factory.createMarket(
            "Market 2",
            block.timestamp + 14 days,
            INITIAL_LIQUIDITY
        );
        address market3 = factory.createMarket(
            "Market 3",
            block.timestamp + 21 days,
            INITIAL_LIQUIDITY
        );
        vm.stopPrank();

        assertEq(factory.getMarketsCount(), 3);
        assertEq(factory.getMarket(0), market1);
        assertEq(factory.getMarket(1), market2);
        assertEq(factory.getMarket(2), market3);
    }

    function testGetAllMarkets() public {
        vm.startPrank(user1);
        token.approve(address(factory), 1000 * 10**18);
        
        factory.createMarket("Market 1", block.timestamp + 7 days, INITIAL_LIQUIDITY);
        factory.createMarket("Market 2", block.timestamp + 14 days, INITIAL_LIQUIDITY);
        vm.stopPrank();

        address[] memory allMarkets = factory.getAllMarkets();
        assertEq(allMarkets.length, 2);
    }

    function testGetMarketsPaginated() public {
        vm.startPrank(user1);
        token.approve(address(factory), 1000 * 10**18);
        
        for (uint256 i = 0; i < 5; i++) {
            factory.createMarket(
                string(abi.encodePacked("Market ", i)),
                block.timestamp + 7 days,
                INITIAL_LIQUIDITY
            );
        }
        vm.stopPrank();

        address[] memory page1 = factory.getMarketsPaginated(0, 2);
        assertEq(page1.length, 2);

        address[] memory page2 = factory.getMarketsPaginated(2, 2);
        assertEq(page2.length, 2);

        address[] memory page3 = factory.getMarketsPaginated(4, 2);
        assertEq(page3.length, 1);
    }

    function testCannotCreateMarketWithShortDuration() public {
        vm.startPrank(user1);
        token.approve(address(factory), INITIAL_LIQUIDITY);
        
        vm.expectRevert(MarketFactory.InvalidDuration.selector);
        factory.createMarket(
            "Short duration market",
            block.timestamp + 30 minutes,
            INITIAL_LIQUIDITY
        );
        vm.stopPrank();
    }

    function testCannotCreateMarketWithLongDuration() public {
        vm.startPrank(user1);
        token.approve(address(factory), INITIAL_LIQUIDITY);
        
        vm.expectRevert(MarketFactory.InvalidDuration.selector);
        factory.createMarket(
            "Long duration market",
            block.timestamp + 400 days,
            INITIAL_LIQUIDITY
        );
        vm.stopPrank();
    }

    function testCannotCreateMarketWithLowLiquidity() public {
        vm.startPrank(user1);
        token.approve(address(factory), 0.5 * 10**18);
        
        vm.expectRevert(MarketFactory.InsufficientLiquidity.selector);
        factory.createMarket(
            "Low liquidity market",
            block.timestamp + 7 days,
            0.5 * 10**18
        );
        vm.stopPrank();
    }

    function testSetMarketCreationFee() public {
        uint256 newFee = 1 * 10**18;
        
        factory.setMarketCreationFee(newFee);
        assertEq(factory.marketCreationFee(), newFee);
    }

    function testOnlyOwnerCanSetFee() public {
        vm.prank(user1);
        vm.expectRevert();
        factory.setMarketCreationFee(1 * 10**18);
    }

    function testSetMinInitialLiquidity() public {
        uint256 newMin = 5 * 10**18;
        
        factory.setMinInitialLiquidity(newMin);
        assertEq(factory.minInitialLiquidity(), newMin);
    }

    function testOnlyOwnerCanSetMinLiquidity() public {
        vm.prank(user1);
        vm.expectRevert();
        factory.setMinInitialLiquidity(5 * 10**18);
    }

    function testSetMinMaxDuration() public {
        uint256 newMin = 2 hours;
        uint256 newMax = 180 days;
        
        factory.setMinMaxDuration(newMin, newMax);
        assertEq(factory.minMarketDuration(), newMin);
        assertEq(factory.maxMarketDuration(), newMax);
    }

    function testCannotSetInvalidDuration() public {
        vm.expectRevert(MarketFactory.InvalidDuration.selector);
        factory.setMinMaxDuration(100 days, 50 days);
    }

    function testSetFeeCollector() public {
        address newCollector = makeAddr("newCollector");
        
        factory.setFeeCollector(newCollector);
        assertEq(factory.feeCollector(), newCollector);
    }

    function testOnlyOwnerCanSetFeeCollector() public {
        address newCollector = makeAddr("newCollector");
        
        vm.prank(user1);
        vm.expectRevert();
        factory.setFeeCollector(newCollector);
    }

    function testPauseFactory() public {
        factory.pause();

        vm.startPrank(user1);
        token.approve(address(factory), INITIAL_LIQUIDITY);
        
        vm.expectRevert();
        factory.createMarket(
            "Paused market",
            block.timestamp + 7 days,
            INITIAL_LIQUIDITY
        );
        vm.stopPrank();
    }

    function testUnpauseFactory() public {
        factory.pause();
        factory.unpause();

        vm.startPrank(user1);
        token.approve(address(factory), INITIAL_LIQUIDITY);
        
        address marketAddress = factory.createMarket(
            "Unpaused market",
            block.timestamp + 7 days,
            INITIAL_LIQUIDITY
        );
        assertTrue(marketAddress != address(0));
        vm.stopPrank();
    }

    function testOnlyOwnerCanPause() public {
        vm.prank(user1);
        vm.expectRevert();
        factory.pause();
    }

    function testOnlyOwnerCanUnpause() public {
        factory.pause();
        
        vm.prank(user1);
        vm.expectRevert();
        factory.unpause();
    }

    function testPauseMarket() public {
        vm.startPrank(user1);
        token.approve(address(factory), INITIAL_LIQUIDITY);
        address marketAddress = factory.createMarket(
            "Test market",
            block.timestamp + 7 days,
            INITIAL_LIQUIDITY
        );
        vm.stopPrank();

        factory.pauseMarket(marketAddress);

        PredictionMarket market = PredictionMarket(marketAddress);
        assertTrue(market.paused());
    }

    function testMarketCreationWithFee() public {
        uint256 fee = 1 * 10**18;
        factory.setMarketCreationFee(fee);

        vm.startPrank(user1);
        token.approve(address(factory), INITIAL_LIQUIDITY + fee);
        
        address marketAddress = factory.createMarket(
            "Market with fee",
            block.timestamp + 7 days,
            INITIAL_LIQUIDITY
        );
        
        assertTrue(marketAddress != address(0));
        vm.stopPrank();
    }

    function testFuzzCreateMarket(uint256 duration, uint256 liquidity) public {
        duration = bound(duration, factory.minMarketDuration(), factory.maxMarketDuration());
        liquidity = bound(liquidity, factory.minInitialLiquidity(), 100 * 10**18);

        token.mint(address(this), liquidity);
        token.approve(address(factory), liquidity);

        address marketAddress = factory.createMarket(
            "Fuzz test market",
            block.timestamp + duration,
            liquidity
        );

        assertTrue(marketAddress != address(0));
        assertTrue(factory.isMarket(marketAddress));
    }
}
