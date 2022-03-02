// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/// @title: MFW
/// @author: manifold.xyz
/// modified from original coding by LucaLush.eth 

import "./core/ERC1155Creator.sol";

contract MFW is ERC1155Creator {
    constructor() ERC1155Creator() {}
}