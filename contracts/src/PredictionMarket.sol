// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract PredictionMarket is ReentrancyGuard, Pausable {
    enum MarketStatus {
        CREATED,
        RESOLVED,
        INVALID
    }

    struct MarketInfo {
        string question;
        uint256 endTime;
        uint256 yesPool;
        uint256 noPool;
        uint256 totalYesShares;
        uint256 totalNoShares;
        MarketStatus status;
        bool outcome;
        address resolver;
    }

    IERC20 public immutable settlementToken;
    MarketInfo public marketInfo;

    mapping(address => uint256) public yesShares;
    mapping(address => uint256) public noShares;
    mapping(address => bool) public hasClaimed;

    uint256 public constant MIN_BET_AMOUNT = 1e15;
    uint256 public constant PLATFORM_FEE_BPS = 100;
    uint256 public constant BPS_DIVISOR = 10000;

    address public immutable factory;
    uint256 public platformFeesCollected;

    event PositionBought(address indexed user, bool isYes, uint256 amount, uint256 shares);
    event MarketResolved(bool outcome, MarketStatus status);
    event WinningsClaimed(address indexed user, uint256 amount);
    event ResolverTransferred(address indexed oldResolver, address indexed newResolver);

    error MarketEnded();
    error MarketNotResolved();
    error MarketAlreadyResolved();
    error InsufficientAmount();
    error NoWinningsToClaim();
    error AlreadyClaimed();
    error UnauthorizedResolver();
    error InvalidOutcome();
    error TransferFailed();

    constructor(
        address _settlementToken,
        string memory _question,
        uint256 _endTime,
        address _resolver,
        uint256 _initialLiquidity
    ) {
        if (_endTime <= block.timestamp) revert InvalidOutcome();
        if (_initialLiquidity < MIN_BET_AMOUNT * 2) revert InsufficientAmount();

        settlementToken = IERC20(_settlementToken);
        factory = msg.sender;

        marketInfo = MarketInfo({
            question: _question,
            endTime: _endTime,
            yesPool: _initialLiquidity / 2,
            noPool: _initialLiquidity / 2,
            totalYesShares: 0,
            totalNoShares: 0,
            status: MarketStatus.CREATED,
            outcome: false,
            resolver: _resolver
        });
    }

    function buyPosition(bool isYes, uint256 amount) external nonReentrant whenNotPaused {
        if (block.timestamp >= marketInfo.endTime) revert MarketEnded();
        if (marketInfo.status != MarketStatus.CREATED) revert MarketAlreadyResolved();
        if (amount < MIN_BET_AMOUNT) revert InsufficientAmount();

        uint256 fee = (amount * PLATFORM_FEE_BPS) / BPS_DIVISOR;
        uint256 amountAfterFee = amount - fee;
        platformFeesCollected += fee;

        if (!settlementToken.transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed();
        }

        uint256 shares = calculateShares(isYes, amountAfterFee);

        if (isYes) {
            yesShares[msg.sender] += shares;
            marketInfo.totalYesShares += shares;
            marketInfo.yesPool += amountAfterFee;
        } else {
            noShares[msg.sender] += shares;
            marketInfo.totalNoShares += shares;
            marketInfo.noPool += amountAfterFee;
        }

        emit PositionBought(msg.sender, isYes, amount, shares);
    }

    function calculateShares(bool isYes, uint256 amount) public view returns (uint256) {
        if (isYes) {
            if (marketInfo.totalYesShares == 0) {
                return amount;
            }
            return (amount * marketInfo.totalYesShares) / marketInfo.yesPool;
        } else {
            if (marketInfo.totalNoShares == 0) {
                return amount;
            }
            return (amount * marketInfo.totalNoShares) / marketInfo.noPool;
        }
    }

    function resolveMarket(bool _outcome) external {
        if (msg.sender != marketInfo.resolver) revert UnauthorizedResolver();
        if (marketInfo.status != MarketStatus.CREATED) revert MarketAlreadyResolved();

        marketInfo.status = MarketStatus.RESOLVED;
        marketInfo.outcome = _outcome;

        emit MarketResolved(_outcome, MarketStatus.RESOLVED);
    }

    function resolveAsInvalid() external {
        if (msg.sender != marketInfo.resolver) revert UnauthorizedResolver();
        if (marketInfo.status != MarketStatus.CREATED) revert MarketAlreadyResolved();

        marketInfo.status = MarketStatus.INVALID;

        emit MarketResolved(false, MarketStatus.INVALID);
    }

    function claimWinnings() external nonReentrant {
        if (marketInfo.status == MarketStatus.CREATED) revert MarketNotResolved();
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();

        uint256 winnings = calculateWinnings(msg.sender);
        if (winnings == 0) revert NoWinningsToClaim();

        hasClaimed[msg.sender] = true;

        if (!settlementToken.transfer(msg.sender, winnings)) {
            revert TransferFailed();
        }

        emit WinningsClaimed(msg.sender, winnings);
    }

    function calculateWinnings(address user) public view returns (uint256) {
        if (marketInfo.status == MarketStatus.CREATED) return 0;

        if (marketInfo.status == MarketStatus.INVALID) {
            uint256 userYesValue = (yesShares[user] * marketInfo.yesPool) / 
                (marketInfo.totalYesShares > 0 ? marketInfo.totalYesShares : 1);
            uint256 userNoValue = (noShares[user] * marketInfo.noPool) / 
                (marketInfo.totalNoShares > 0 ? marketInfo.totalNoShares : 1);
            return userYesValue + userNoValue;
        }

        uint256 totalPool = marketInfo.yesPool + marketInfo.noPool - platformFeesCollected;

        if (marketInfo.outcome) {
            if (marketInfo.totalYesShares == 0) return 0;
            return (yesShares[user] * totalPool) / marketInfo.totalYesShares;
        } else {
            if (marketInfo.totalNoShares == 0) return 0;
            return (noShares[user] * totalPool) / marketInfo.totalNoShares;
        }
    }

    function getUserPosition(address user) external view returns (uint256 yes, uint256 no) {
        return (yesShares[user], noShares[user]);
    }

    function getPrice(bool isYes) external view returns (uint256) {
        uint256 total = marketInfo.yesPool + marketInfo.noPool;
        if (total == 0) return 5000;
        
        if (isYes) {
            return (marketInfo.yesPool * BPS_DIVISOR) / total;
        } else {
            return (marketInfo.noPool * BPS_DIVISOR) / total;
        }
    }

    function transferResolver(address newResolver) external {
        if (msg.sender != marketInfo.resolver) revert UnauthorizedResolver();
        if (newResolver == address(0)) revert InvalidOutcome();

        address oldResolver = marketInfo.resolver;
        marketInfo.resolver = newResolver;

        emit ResolverTransferred(oldResolver, newResolver);
    }

    function withdrawPlatformFees(address to) external {
        if (msg.sender != factory) revert UnauthorizedResolver();
        if (platformFeesCollected == 0) return;

        uint256 fees = platformFeesCollected;
        platformFeesCollected = 0;

        if (!settlementToken.transfer(to, fees)) {
            revert TransferFailed();
        }
    }

    function pause() external {
        if (msg.sender != factory && msg.sender != marketInfo.resolver) {
            revert UnauthorizedResolver();
        }
        _pause();
    }

    function unpause() external {
        if (msg.sender != factory) revert UnauthorizedResolver();
        _unpause();
    }
}
