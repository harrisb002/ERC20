// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// USing for capping the supply of the token and grants for fail safes/ same for burnable to remove tokens
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Squares is ERC20Capped, ERC20Burnable {
    address payable public owner; // Must make payable to recieve minted tokens
    uint256 public blockReward;

    constructor(
        uint256 TokenCap,
        uint256 reward
    ) ERC20("Squares", "SQZ") ERC20Capped(TokenCap * (10 ** decimals())) {
        // Use the constructor to set the Token mac supply
        // _mint => Creates a certain amount of tokens and assigns to the deployer of the contract.
        // Internal function and must be called within the smart contract
        _mint(msg.sender, 10000000 * (10 ** decimals()));

        // Set the owner and ensure owner is recieving payable address
        owner = payable(msg.sender);

        // Create block reward
        blockReward = reward * (10 ** decimals());
    }

    // Modifier to restrict acces to functions for only the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // Paramaters are 'to' and the 'amount'. Accessing the one who created the block through block.coinbase
    function _mintMinerReward() internal {
        _mint(block.coinbase, blockReward);
    }

    // Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
    // (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
    // this function.
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20Capped, ERC20) {
        if (
            from != address(0) && // Cant send from the burn address
            to != block.coinbase && // Keeps from an infinite loop
            block.coinbase != address(0) && // No sending to burn address either
            ERC20.totalSupply() + blockReward <= cap() // Make sure cap will not be exceeded
        ) {
            _mintMinerReward();
        }
        super._update(from, to, value);
        emit Transfer(from, to, value);
    }

    // Setting the block reward if desired to change
    function setBlockReward(uint256 reward) public onlyOwner {
        blockReward = reward * (10 ** decimals());
    }

    function destroy() public onlyOwner {
        selfdestruct(owner);
        // Whats a better way to do this instead of using selfdestruct?
    }
}
