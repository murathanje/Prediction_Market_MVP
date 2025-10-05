// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/SettlementToken.sol";
import "../src/MarketFactory.sol";
import "../src/PredictionMarket.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying contracts...");
        console.log("Deployer address:", vm.addr(deployerPrivateKey));

        SettlementToken token = new SettlementToken();
        console.log("SettlementToken deployed at:", address(token));

        MarketFactory factory = new MarketFactory(address(token));
        console.log("MarketFactory deployed at:", address(factory));

        uint256 initialMintAmount = 1000000 * 10**18;
        token.mint(vm.addr(deployerPrivateKey), initialMintAmount);
        console.log("Minted", initialMintAmount / 10**18, "tokens to deployer");

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("SettlementToken:", address(token));
        console.log("MarketFactory:", address(factory));
        console.log("\nUpdate your .env file with these addresses:");
        console.log("SETTLEMENT_TOKEN_ADDRESS=", address(token));
        console.log("MARKET_FACTORY_ADDRESS=", address(factory));
    }
}

contract CreateTestMarket is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tokenAddress = vm.envAddress("SETTLEMENT_TOKEN_ADDRESS");
        address factoryAddress = vm.envAddress("MARKET_FACTORY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Creating test market...");

        SettlementToken token = SettlementToken(tokenAddress);
        MarketFactory factory = MarketFactory(factoryAddress);

        uint256 initialLiquidity = 100 * 10**18;
        
        token.approve(address(factory), initialLiquidity);

        address marketAddress = factory.createMarket(
            "Will Bitcoin reach $100,000 by end of 2025?",
            block.timestamp + 30 days,
            initialLiquidity
        );

        console.log("Test market created at:", marketAddress);

        PredictionMarket market = PredictionMarket(marketAddress);
        
        (
            string memory question,
            uint256 endTime,
            uint256 yesPool,
            uint256 noPool,
            ,
            ,
            ,
            ,
            address resolver
        ) = market.marketInfo();

        console.log("\n=== Market Info ===");
        console.log("Question:", question);
        console.log("End Time:", endTime);
        console.log("YES Pool:", yesPool / 10**18);
        console.log("NO Pool:", noPool / 10**18);
        console.log("Resolver:", resolver);
        console.log("Market Address:", marketAddress);

        vm.stopBroadcast();
    }
}
