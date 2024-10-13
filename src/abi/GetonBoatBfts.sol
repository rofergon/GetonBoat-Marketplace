// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MyNFTCollection is ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    uint256 public tokenCounter;
    uint256 public mintPrice = 0.0001 ether;
 
    event TokenURIUpdated(uint256 indexed tokenId, string newTokenURI);
    event MintPriceUpdated(uint256 newPrice);

    constructor() ERC721("GetOnBoatNfts", "GOBN") Ownable(msg.sender) {
        tokenCounter = 0;
    }

    function mintNFT(string memory tokenURI) public payable whenNotPaused nonReentrant returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient Ether sent.");

        uint256 newItemId = tokenCounter;
        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        
        unchecked {
            tokenCounter += 1;
        }
        return newItemId;
    }

    function updateTokenURI(uint256 tokenId, string memory newTokenURI) public onlyOwner {
        _setTokenURI(tokenId, newTokenURI);
        emit TokenURIUpdated(tokenId, newTokenURI);
    }

    function withdraw() public onlyOwner nonReentrant {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed.");
    }

    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
