// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PredictionMarket.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MarketFactory is Ownable, Pausable {
    address public immutable settlementToken;
    
    address[] public markets;
    mapping(address => bool) public isMarket;
    
    uint256 public minMarketDuration = 1 hours;
    uint256 public maxMarketDuration = 365 days;
    uint256 public minInitialLiquidity = 1e18;
    uint256 public marketCreationFee = 0;

    address public feeCollector;

    event MarketCreated(
        uint256 indexed marketId,
        address indexed marketAddress,
        string question,
        uint256 endTime,
        address indexed creator
    );
    event MarketCreationFeeUpdated(uint256 newFee);
    event MinInitialLiquidityUpdated(uint256 newMin);
    event FeeCollectorUpdated(address indexed newCollector);

    error InvalidDuration();
    error InsufficientLiquidity();
    error InvalidAddress();
    error MarketCreationFailed();
    error InvalidFee();

    constructor(address _settlementToken) {
        if (_settlementToken == address(0)) revert InvalidAddress();
        
        settlementToken = _settlementToken;
        feeCollector = msg.sender;
    }

    function createMarket(
        string memory question,
        uint256 endTime,
        uint256 initialLiquidity
    ) external whenNotPaused returns (address) {
        uint256 duration = endTime - block.timestamp;
        if (duration < minMarketDuration || duration > maxMarketDuration) {
            revert InvalidDuration();
        }
        
        if (initialLiquidity < minInitialLiquidity) {
            revert InsufficientLiquidity();
        }

        if (marketCreationFee > 0) {
            if (!IERC20(settlementToken).transferFrom(msg.sender, feeCollector, marketCreationFee)) {
                revert MarketCreationFailed();
            }
        }

        if (!IERC20(settlementToken).transferFrom(msg.sender, address(this), initialLiquidity)) {
            revert MarketCreationFailed();
        }

        PredictionMarket market = new PredictionMarket(
            settlementToken,
            question,
            endTime,
            msg.sender,
            initialLiquidity
        );

        address marketAddress = address(market);
        
        if (!IERC20(settlementToken).transfer(marketAddress, initialLiquidity)) {
            revert MarketCreationFailed();
        }

        markets.push(marketAddress);
        isMarket[marketAddress] = true;

        emit MarketCreated(
            markets.length - 1,
            marketAddress,
            question,
            endTime,
            msg.sender
        );

        return marketAddress;
    }

    function getMarket(uint256 marketId) external view returns (address) {
        if (marketId >= markets.length) revert InvalidAddress();
        return markets[marketId];
    }

    function getAllMarkets() external view returns (address[] memory) {
        return markets;
    }

    function getMarketsCount() external view returns (uint256) {
        return markets.length;
    }

    function getMarketsPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory) {
        uint256 total = markets.length;
        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        address[] memory result = new address[](end - offset);
        for (uint256 i = 0; i < end - offset; i++) {
            result[i] = markets[offset + i];
        }

        return result;
    }

    function setMarketCreationFee(uint256 newFee) external onlyOwner {
        marketCreationFee = newFee;
        emit MarketCreationFeeUpdated(newFee);
    }

    function setMinInitialLiquidity(uint256 newMin) external onlyOwner {
        if (newMin == 0) revert InsufficientLiquidity();
        minInitialLiquidity = newMin;
        emit MinInitialLiquidityUpdated(newMin);
    }

    function setMinMaxDuration(uint256 newMin, uint256 newMax) external onlyOwner {
        if (newMin == 0 || newMax <= newMin) revert InvalidDuration();
        minMarketDuration = newMin;
        maxMarketDuration = newMax;
    }

    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();
        feeCollector = newCollector;
        emit FeeCollectorUpdated(newCollector);
    }

    function withdrawPlatformFees(address market, address to) external onlyOwner {
        if (!isMarket[market]) revert InvalidAddress();
        PredictionMarket(market).withdrawPlatformFees(to);
    }

    function pauseMarket(address market) external onlyOwner {
        if (!isMarket[market]) revert InvalidAddress();
        PredictionMarket(market).pause();
    }

    function unpauseMarket(address market) external onlyOwner {
        if (!isMarket[market]) revert InvalidAddress();
        PredictionMarket(market).unpause();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
