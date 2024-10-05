// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Marketplace is ReentrancyGuard, Ownable, IERC721Receiver {
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.UintSet;

    Counters.Counter private _marketItemIds;
    Counters.Counter private _tokensSold;
    Counters.Counter private _tokensCanceled;

    uint256 private constant BASIS_POINTS = 10000;
    uint256 private commissionPercentage = 250;
    uint256 private accumulatedCommissions;

    mapping(uint256 => MarketItem) private marketItemIdToMarketItem;

    struct MarketItem {
        uint256 marketItemId;
        address nftContractAddress;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
        bool canceled;
    }

    enum Property { Seller, Owner }

    event MarketItemCreated(
        uint256 indexed marketItemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold,
        bool canceled
    );
    event MarketItemSold(uint256 indexed marketItemId, address buyer, uint256 price);
    event MarketItemCanceled(uint256 indexed marketItemId);
    event CommissionsWithdrawn(address indexed owner, uint256 amount);
    event MarketItemOwnershipChanged(uint256 indexed marketItemId, address indexed previousOwner, address indexed newOwner);
    event MarketItemPriceUpdated(uint256 indexed marketItemId, uint256 oldPrice, uint256 newPrice);
    event NFTTransferred(address indexed from, address indexed to, uint256 indexed tokenId, address nftContract);
    event CommissionPercentageUpdated(uint256 oldPercentage, uint256 newPercentage);

    constructor() Ownable(msg.sender) {
    }

    mapping(address => EnumerableSet.UintSet) private userListedItems;
    mapping(address => EnumerableSet.UintSet) private userOwnedItems;

    // Agregar este mapeo al inicio del contrato, junto con las otras variables de estado
    mapping(address => mapping(uint256 => bool)) private nftListed;

    function createMarketItem(
        address nftContractAddress,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be at least 1 wei");
        
        // Verificar que el llamante es el propietario del NFT
        require(
            IERC721(nftContractAddress).ownerOf(tokenId) == msg.sender,
            "Caller is not the owner of the NFT"
        );
        
        // Verificar la aprobación
        require(
            IERC721(nftContractAddress).getApproved(tokenId) == address(this) ||
            IERC721(nftContractAddress).isApprovedForAll(msg.sender, address(this)),
            "Marketplace contract is not approved to transfer this NFT"
        );

        // Agregar esta nueva verificación
        require(
            !nftListed[nftContractAddress][tokenId],
            "This NFT is already listed"
        );

        _marketItemIds.increment();
        uint256 marketItemId = _marketItemIds.current();

        marketItemIdToMarketItem[marketItemId] = MarketItem(
            marketItemId,
            nftContractAddress,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false,
            false
        );

        // Marcar el NFT como listado antes de la transferencia
        nftListed[nftContractAddress][tokenId] = true;

        // Actualizar userListedItems antes de la transferencia
        userListedItems[msg.sender].add(marketItemId);

        // Realizar la transferencia después de actualizar el estado
        IERC721(nftContractAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        emit NFTTransferred(msg.sender, address(this), tokenId, nftContractAddress);

        emit MarketItemCreated(
            marketItemId,
            nftContractAddress,
            tokenId,
            msg.sender,
            address(0),
            price,
            false,
            false
        );

        return marketItemId;
    }

    function cancelMarketItem(address nftContractAddress, uint256 marketItemId) public nonReentrant {
        MarketItem storage item = marketItemIdToMarketItem[marketItemId];
        require(item.tokenId > 0, "Market item does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        require(!item.sold, "Cannot cancel a sold item");
        require(!item.canceled, "Market item is already canceled");

        userListedItems[msg.sender].remove(marketItemId);

        item.owner = payable(address(0));
        item.canceled = true;
        _tokensCanceled.increment();

        emit MarketItemCanceled(marketItemId);

        IERC721(nftContractAddress).safeTransferFrom(address(this), msg.sender, item.tokenId);
        emit NFTTransferred(address(this), msg.sender, item.tokenId, nftContractAddress);

        // Marcar el NFT como no listado
        nftListed[nftContractAddress][item.tokenId] = false;
    }

    function createMarketSale(address nftContractAddress, uint256 marketItemId) public payable nonReentrant {
        MarketItem storage item = marketItemIdToMarketItem[marketItemId];
        require(item.price > 0, "Market item does not exist");
        require(!item.sold, "Market item is already sold");
        require(!item.canceled, "Market item has been canceled");
        require(msg.value >= item.price, "Insufficient funds sent");
        require(item.seller != msg.sender, "El comprador no puede ser el vendedor");

        uint256 commission = (item.price * commissionPercentage) / BASIS_POINTS;
        uint256 sellerProceeds = item.price - commission;
        uint256 excess = msg.value - item.price;

        address previousOwner = item.owner;
        item.owner = payable(msg.sender);
        _tokensSold.increment();
        accumulatedCommissions += commission;

        userListedItems[item.seller].remove(marketItemId);
        userOwnedItems[msg.sender].add(marketItemId);

        emit MarketItemOwnershipChanged(marketItemId, previousOwner, msg.sender);

        emit MarketItemSold(marketItemId, msg.sender, item.price);

        (bool sent, ) = item.seller.call{value: sellerProceeds}("");
        require(sent, "Failed to send Ether to the seller");

        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }

        IERC721(nftContractAddress).safeTransferFrom(address(this), msg.sender, item.tokenId);
        emit NFTTransferred(address(this), msg.sender, item.tokenId, nftContractAddress);

        // Marcar el NFT como no listado después de la venta
        nftListed[nftContractAddress][item.tokenId] = false;
    }

    function fetchAvailableMarketItems(uint256 start, uint256 count) external view returns (MarketItem[] memory) {
        uint256 itemsCount = _marketItemIds.current();
        uint256 availableItemsCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = start; i < itemsCount && i < start + count; i++) {
            if (!marketItemIdToMarketItem[i + 1].sold && !marketItemIdToMarketItem[i + 1].canceled) {
                availableItemsCount++;
            }
        }

        MarketItem[] memory marketItems = new MarketItem[](availableItemsCount);

        for (uint256 i = start; i < itemsCount && currentIndex < availableItemsCount; i++) {
            MarketItem storage item = marketItemIdToMarketItem[i + 1];
            if (!item.sold && !item.canceled) {
                marketItems[currentIndex] = item;
                currentIndex++;
            }
        }

        return marketItems;
    }

    function fetchSellingMarketItems(uint256 start, uint256 count) public view returns (MarketItem[] memory) {
        uint256 totalItems = userListedItems[msg.sender].length();
        if (start >= totalItems) {
            return new MarketItem[](0);
        }

        uint256 end = start + count;
        if (end > totalItems) {
            end = totalItems;
        }
        uint256 resultCount = end - start;

        MarketItem[] memory marketItems = new MarketItem[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            uint256 marketItemId = userListedItems[msg.sender].at(start + i);
            marketItems[i] = marketItemIdToMarketItem[marketItemId];
        }

        return marketItems;
    }

    function fetchOwnedMarketItems(uint256 start, uint256 count) public view returns (MarketItem[] memory) {
        uint256 totalItems = userOwnedItems[msg.sender].length();
        if (start >= totalItems) {
            return new MarketItem[](0);
        }

        uint256 end = start + count;
        if (end > totalItems) {
            end = totalItems;
        }
        uint256 resultCount = end - start;

        MarketItem[] memory marketItems = new MarketItem[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            uint256 marketItemId = userOwnedItems[msg.sender].at(start + i);
            marketItems[i] = marketItemIdToMarketItem[marketItemId];
        }

        return marketItems;
    }

    function withdrawCommissions() public onlyOwner {
        require(accumulatedCommissions > 0, "No commissions to withdraw");
        uint256 amount = accumulatedCommissions;
        accumulatedCommissions = 0;
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Failed to transfer Ether");
        emit CommissionsWithdrawn(owner(), amount);
    }

    function getAccumulatedCommissions() public view returns (uint256) {
        return accumulatedCommissions;
    }

    function setCommissionPercentage(uint256 newPercentage) public onlyOwner {
        require(newPercentage <= 1000, "Commission percentage cannot exceed 10%");
        uint256 oldPercentage = commissionPercentage;
        commissionPercentage = newPercentage;
        emit CommissionPercentageUpdated(oldPercentage, newPercentage);
    }

    function updateMarketItemPrice(uint256 marketItemId, uint256 newPrice) public nonReentrant {
        MarketItem storage item = marketItemIdToMarketItem[marketItemId];
        require(item.seller == msg.sender, "Only the seller can update the price");
        require(!item.sold && !item.canceled, "Cannot update price of sold or canceled items");
        require(newPrice > 0, "Price must be greater than zero");

        uint256 oldPrice = item.price;
        item.price = newPrice;

        emit MarketItemPriceUpdated(marketItemId, oldPrice, newPrice);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {
        revert("Direct Ether transfers not allowed");
    }

    fallback() external payable {
        revert("Direct Ether transfers not allowed");
    }
}