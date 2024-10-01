// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplaceWithFees is ReentrancyGuard, Ownable {
    uint256 public feePercentage = 250; // 2.5% fee
    uint256 public constant FEE_DENOMINATOR = 10000;

    struct Listing {
        uint256 price;
        address seller;
    }

    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_proceeds;
    uint256 private s_accumulatedFees;

    event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price);
    event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price);
    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId);
    event FeePercentageUpdated(uint256 newFeePercentage);

    constructor() Ownable(msg.sender) {
        // Inicialización adicional si es necesaria
    }

    modifier notListed(address nftAddress, uint256 tokenId, address owner) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        require(listing.price == 0, "Already listed");
        _;
    }

    modifier isOwner(address nftAddress, uint256 tokenId, address spender) {
        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == spender, "Not the owner");
        _;
    }

    function listItem(address nftAddress, uint256 tokenId, uint256 price) external notListed(nftAddress, tokenId, msg.sender) isOwner(nftAddress, tokenId, msg.sender) {
        require(price > 0, "Price must be above zero");
        IERC721 nft = IERC721(nftAddress);
        require(nft.getApproved(tokenId) == address(this), "Not approved for marketplace");
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(address nftAddress, uint256 tokenId) external payable nonReentrant {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        require(listedItem.price > 0, "Item not listed");
        require(msg.value == listedItem.price, "Incorrect price");

        uint256 fee = (msg.value * feePercentage) / FEE_DENOMINATOR;
        uint256 sellerProceeds = msg.value - fee;

        s_proceeds[listedItem.seller] += sellerProceeds;
        s_accumulatedFees += fee;

        delete s_listings[nftAddress][tokenId];
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, msg.value);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        require(proceeds > 0, "No proceeds to withdraw");
        s_proceeds[msg.sender] = 0;
        payable(msg.sender).transfer(proceeds);
    }

    function cancelListing(address nftAddress, uint256 tokenId) external isOwner(nftAddress, tokenId, msg.sender) {
        delete s_listings[nftAddress][tokenId];
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee percentage cannot exceed 10%");
        feePercentage = _feePercentage;
        emit FeePercentageUpdated(_feePercentage);
    }

    function withdrawFees() external onlyOwner {
        uint256 fees = s_accumulatedFees;
        require(fees > 0, "No fees to withdraw");
        s_accumulatedFees = 0;
        payable(owner()).transfer(fees);
    }
}