// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {
    constructor(uint initialSupply) ERC20("weth", "WETH") {
        _mint(msg.sender, initialSupply);
    }
}
