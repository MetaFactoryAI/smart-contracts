// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@manifoldxyz/creator-core-solidity/contracts/ERC721Creator.sol";

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                  @@@@@@#                  @
// @                  @@@@@@#                  @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@      @@@@@@#      @@@@@@      @
// @      @@@@@@                   @@@@@@      @
// @      @@@@@@                   @@@@@@      @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

/// @title MFW wearables contract
contract MFWUniques is ERC721Creator {
    constructor(string memory _name, string memory _symbol) ERC721Creator(_name, _symbol) {}
}