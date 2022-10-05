// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "erc721a/contracts/ERC721A.sol";

contract MFWERC721A is ERC721A {
    constructor(string memory _name, string memory _symbol) ERC721A(_name, _symbol) {}

    function mint(uint256 quantity) external payable {
        // `_mint`'s second argument now takes in a `quantity`, not a `tokenId`.
        _mint(msg.sender, quantity);
    }
}