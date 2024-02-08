// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract Token is ERC20 {
    //Mint the supply of token to the deployer of the contract. Then distribute them.
    constructor(uint initialSupply) ERC20("Benz", "BENZ") {//Call ERC20 base contract constructor
    // _mint => Creates a certain amount of tokens and assigns to the deployer of the contract.
    // Internal function and must be called within the smart contract
        _mint(msg.sender, initialSupply); //Thus only this address can mint tokens. Limiting and can be update with more addresses
    }

}
