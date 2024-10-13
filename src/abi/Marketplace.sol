// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Marketplace is ReentrancyGuard, Ownable, IERC721Receiver {
    using EnumerableSet for EnumerableSet.UintSet;
    using Address for address payable;

    uint256 private _lastItemId;
    uint256 private _soldItemsCount;
    uint256 private _canceledItemsCount;

    uint256 private constant BASIS_POINTS = 10000;
    uint256 private commissionPercentage = 250; // 2.5%
    uint256 private accumulatedCommissions;

    uint256 private constant MIN_LISTING_DURATION = 6 days;
    uint256 private constant MAX_LISTING_DURATION = 180 days; // 6 meses

    uint256 private cleanupIterationLimit = 20;

    mapping(uint256 => MarketItem) private marketItemIdToMarketItem;

    struct MarketItem {
        uint256 marketItemId;
        address nftContractAddress;
        uint256 tokenId;
        address payable seller;
        address payable buyer;
        uint256 price;
        bool sold;
        bool canceled;
        uint256 expirationTime;
    }

    event MarketItemCreated(
        uint256 indexed marketItemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );
    event MarketItemSold(uint256 indexed marketItemId, address buyer, uint256 price);
    event MarketItemCanceled(uint256 indexed marketItemId);
    event CommissionsWithdrawn(address indexed owner, uint256 amount);
    event MarketItemPriceUpdated(uint256 indexed marketItemId, uint256 oldPrice, uint256 newPrice);
    event CommissionPercentageUpdated(uint256 oldPercentage, uint256 newPercentage);
    event NFTTransferred(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId,
        address nftContractAddress
    );
    event MarketItemExpired(uint256 indexed marketItemId);
    event CleanupIterationLimitUpdated(uint256 oldLimit, uint256 newLimit);

    constructor() Ownable(msg.sender) {}

    mapping(address => EnumerableSet.UintSet) private userListedItems;
    mapping(address => mapping(uint256 => bool)) private nftListed;
    EnumerableSet.UintSet private availableMarketItemIds;

    function _cleanUpExpiredMarketItems(uint256 maxIterations) internal {
        uint256 totalAvailable = availableMarketItemIds.length();
        uint256 iterations = 0;
        uint256 i = 0;

        while (i < totalAvailable && iterations < maxIterations) {
            uint256 marketItemId = availableMarketItemIds.at(i);
            MarketItem storage item = marketItemIdToMarketItem[marketItemId];

            if (block.timestamp > item.expirationTime && !item.sold && !item.canceled) {
                _expireMarketItem(marketItemId, item);
                totalAvailable--;
            } else {
                i++;
            }

            iterations++;
        }
    }

    function createMarketItem(
        address nftContractAddress,
        uint256 tokenId,
        uint256 price,
        uint256 listingDuration
    ) external nonReentrant returns (uint256) {
        _cleanUpExpiredMarketItems(20); // Limita a 20 iteraciones

        require(price > 0, "Precio invalido");
        require(
            IERC721(nftContractAddress).ownerOf(tokenId) == msg.sender,
            "No eres el propietario"
        );
        require(
            IERC721(nftContractAddress).getApproved(tokenId) == address(this) ||
            IERC721(nftContractAddress).isApprovedForAll(msg.sender, address(this)),
            "Marketplace no aprobado"
        );
        require(
            !nftListed[nftContractAddress][tokenId],
            "NFT ya listado"
        );
        require(
            listingDuration >= MIN_LISTING_DURATION && listingDuration <= MAX_LISTING_DURATION,
            "Duracion de listado invalida"
        );

        _lastItemId += 1;
        uint256 newItemId = _lastItemId;

        uint256 expirationTime = block.timestamp + listingDuration;

        marketItemIdToMarketItem[newItemId] = MarketItem(
            newItemId,
            nftContractAddress,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false,
            false,
            expirationTime
        );

        nftListed[nftContractAddress][tokenId] = true;
        userListedItems[msg.sender].add(newItemId);
        availableMarketItemIds.add(newItemId);

        emit MarketItemCreated(
            newItemId,
            nftContractAddress,
            tokenId,
            msg.sender,
            price
        );

        return newItemId;
    }

    function cancelMarketItem(uint256 marketItemId) public nonReentrant {
        MarketItem storage item = marketItemIdToMarketItem[marketItemId];
        require(item.tokenId > 0, "El item del mercado no existe");
        require(item.seller == msg.sender, "No eres el vendedor");
        require(!item.sold, "No se puede cancelar un item vendido");
        require(!item.canceled, "El item del mercado ya esta cancelado");

        _removeMarketItem(marketItemId, item);
        _canceledItemsCount += 1;

        emit MarketItemCanceled(marketItemId);
    }

    function createMarketSale(
        uint256 marketItemId,
        address nftContractAddress,
        uint256 tokenId
    ) public payable nonReentrant {
        MarketItem storage item = marketItemIdToMarketItem[marketItemId];
        
        require(_isMarketItemValid(item), "Listado expirado o invalido");
        require(item.price > 0, "El item del mercado no existe");
        require(!item.sold, "El item ya esta vendido");
        require(!item.canceled, "El item ha sido cancelado");
        require(msg.value >= item.price, "Fondos insuficientes enviados");
        require(item.seller != msg.sender, "El comprador no puede ser el vendedor");
        require(item.nftContractAddress == nftContractAddress, "Direccion de contrato NFT incorrecta");
        require(item.tokenId == tokenId, "Token ID incorrecto");

        IERC721 nftContract = IERC721(nftContractAddress);
        
        // Verificar que el token existe y que el vendedor es el propietario
        require(nftContract.ownerOf(tokenId) == item.seller, "El vendedor ya no es el propietario del NFT");

        // Verificar que el marketplace tiene la aprobación para transferir el NFT
        require(
            nftContract.getApproved(tokenId) == address(this) ||
            nftContract.isApprovedForAll(item.seller, address(this)),
            "El marketplace no tiene la aprobacion para transferir este NFT"
        );

        uint256 commission = (item.price * commissionPercentage) / BASIS_POINTS;
        uint256 sellerProceeds = item.price - commission;
        uint256 excess = msg.value - item.price;

        accumulatedCommissions += commission;

        address seller = item.seller;
        uint256 price = item.price;
        
        _removeMarketItem(marketItemId, item);

        // Transferir el NFT al comprador
        try nftContract.safeTransferFrom(seller, msg.sender, tokenId) {
            emit NFTTransferred(seller, msg.sender, tokenId, nftContractAddress);
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("Error al transferir NFT: ", reason)));
        } catch {
            revert("Error desconocido al transferir NFT");
        }

        // Pagar al vendedor
        (bool success, ) = payable(seller).call{value: sellerProceeds}("");
        require(success, "Error al pagar al vendedor");

        // Devolver el exceso de fondos al comprador, si los hay
        if (excess > 0) {
            (success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "Error al devolver el exceso de fondos");
        }

        emit MarketItemSold(marketItemId, msg.sender, price);
    }

    function fetchAvailableMarketItems(uint256 start, uint256 count) external view returns (MarketItem[] memory) {
        uint256 totalAvailable = availableMarketItemIds.length();
        uint256 fetchedCount = 0;
        MarketItem[] memory tempItems = new MarketItem[](count);

        uint256 i = start;
        while (i < totalAvailable && fetchedCount < count) {
            uint256 marketItemId = availableMarketItemIds.at(i);
            MarketItem storage item = marketItemIdToMarketItem[marketItemId];

            if (block.timestamp <= item.expirationTime && !item.sold && !item.canceled) {
                tempItems[fetchedCount] = item;
                fetchedCount++;
            }

            i++;
        }

        MarketItem[] memory marketItems = new MarketItem[](fetchedCount);
        for (uint256 j = 0; j < fetchedCount; j++) {
            marketItems[j] = tempItems[j];
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

    function withdrawCommissions() public onlyOwner {
        require(accumulatedCommissions > 0, "No hay comisiones para retirar");
        uint256 amount = accumulatedCommissions;
        accumulatedCommissions = 0;
        payable(owner()).sendValue(amount);
        emit CommissionsWithdrawn(owner(), amount);
    }

    function getAccumulatedCommissions() public view returns (uint256) {
        return accumulatedCommissions;
    }

    function setCommissionPercentage(uint256 newPercentage) public onlyOwner {
        require(newPercentage <= 1000, "El porcentaje de comision no puede exceder el 10%");
        uint256 oldPercentage = commissionPercentage;
        commissionPercentage = newPercentage;
        emit CommissionPercentageUpdated(oldPercentage, newPercentage);
    }

    function updateMarketItemPrice(uint256 marketItemId, uint256 newPrice) public {
        MarketItem storage item = marketItemIdToMarketItem[marketItemId];
        require(item.seller == msg.sender, "Solo el vendedor puede actualizar el precio");
        require(!item.sold && !item.canceled, "No se puede actualizar el precio de items vendidos o cancelados");
        require(newPrice > 0, "El precio debe ser mayor que cero");

        uint256 oldPrice = item.price;
        item.price = newPrice;

        emit MarketItemPriceUpdated(marketItemId, oldPrice, newPrice);
    }

    function _removeMarketItem(uint256 marketItemId, MarketItem storage item) internal {
        nftListed[item.nftContractAddress][item.tokenId] = false;
        availableMarketItemIds.remove(marketItemId);
        userListedItems[item.seller].remove(marketItemId);
        delete marketItemIdToMarketItem[marketItemId]; // Liberar almacenamiento
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
        revert("Transferencias directas de Ether no permitidas");
    }

    fallback() external payable {
        revert("Transferencias directas de Ether no permitidas");
    }

    // Nueva función para obtener un artículo del mercado por su ID
    function fetchMarketItem(uint256 marketItemId) external view returns (MarketItem memory) {
        return marketItemIdToMarketItem[marketItemId];
    }

    // Nueva función para obtener el total de artículos disponibles en el mercado
    function getTotalAvailableMarketItems() external view returns (uint256) {
        return availableMarketItemIds.length();
    }

    // Función para manejar la expiración de elementos del mercado
    function removeExpiredMarketItems(uint256[] calldata marketItemIds) external {
        for (uint256 i = 0; i < marketItemIds.length; i++) {
            uint256 marketItemId = marketItemIds[i];
            MarketItem storage item = marketItemIdToMarketItem[marketItemId];
            if (block.timestamp > item.expirationTime && !item.sold && !item.canceled) {
                _expireMarketItem(marketItemId, item);
            }
        }
    }

    function _expireMarketItem(uint256 marketItemId, MarketItem storage item) internal {
        _removeMarketItem(marketItemId, item);
        _canceledItemsCount += 1;
        emit MarketItemExpired(marketItemId);
    }

    // Nueva función auxiliar para verificar la validez del MarketItem
    function _isMarketItemValid(MarketItem storage item) internal view returns (bool) {
        return item.price > 0 && !item.sold && !item.canceled && block.timestamp <= item.expirationTime;
    }

    function setCleanupIterationLimit(uint256 newLimit) external onlyOwner {
        require(newLimit > 0 && newLimit <= 100, "Limite de iteraciones invalido");
        uint256 oldLimit = cleanupIterationLimit;
        cleanupIterationLimit = newLimit;
        emit CleanupIterationLimitUpdated(oldLimit, newLimit);
    }

    function getCleanupIterationLimit() external view returns (uint256) {
        return cleanupIterationLimit;
    }
}
