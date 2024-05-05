// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Squares is ERC20 {
    address public owner;
    IERC20 public weth;
    uint256 public price;

    constructor(IERC20 _weth, uint256 _price) ERC20("Squares", "SQZ") {
        owner = msg.sender;
        price = _price;
        weth = _weth;
        _mint(address(this), 100000000000 * (10 ** 18));
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    function buyTokensUsingEther() external payable {
        console.log("\n\nWithin the buyTokensUsingEther function");
        console.log("address(this): ", address(this));
        console.log("Msg.sender: ", msg.sender);

        require(msg.value > 0, "Must send ETH");
        uint256 tokensToBuy = etherExchangeRate(msg.value);

        console.log("Balance of Contract: ", balanceOf(address(this)));
        console.log("Msg.sender balance: ", balanceOf(msg.sender));

        require(
            tokensToBuy <= balanceOf(address(this)),
            "Not enough tokens in Contract"
        );
        _transfer(address(this), msg.sender, tokensToBuy);

        console.log(
            "Balance of Contract after transfer: ",
            balanceOf(address(this))
        );
        console.log(
            "Msg.sender balance after transfer: ",
            balanceOf(msg.sender)
        );
    }

    function buyTokensUsingWETH(uint256 amountOfWETH) external {
        console.log("\n\nWithin the buyTokensUsingWETH function");
        require(amountOfWETH > 0, "Must send WETH");

        console.log("address(this): ", address(this));
        console.log("Msg.sender: ", msg.sender);
        console.log("Msg.sender WETH balance: ", weth.balanceOf(msg.sender));

        uint256 tokensToBuy = etherExchangeRate(amountOfWETH);
        console.log("SQZ tokens to buy ", tokensToBuy);

        uint256 allowance = weth.allowance(msg.sender, address(this));
        console.log("Allowance for Squares contract: ", allowance);

        require(allowance >= amountOfWETH, "Not enough WETH allowance");

        // // Transfer WETH to SQZ contract
        bool wethTransferred = weth.transferFrom(
            msg.sender,
            address(this),
            amountOfWETH
        );

        require(wethTransferred, "WETH transfer failed");

        // Transfer SQZ tokens to the sender
        _transfer(address(this), msg.sender, tokensToBuy);

        console.log(
            "Balance of WETH Contract after transfer: ",
            weth.balanceOf(address(this))
        );
        console.log(
            "Msg.sender WETH balance after transfer: ",
            weth.balanceOf(msg.sender)
        );

        console.log(
            "Balance of SQZ Contract after transfer: ",
            balanceOf(address(this))
        );
        console.log(
            "Msg.sender SQZ balance after transfer: ",
            balanceOf(msg.sender)
        );
        allowance = weth.allowance(msg.sender, address(this));
        console.log("Allowance for Squares contract is now: ", allowance);
    }

    function withdrawTokens() external onlyOwner {
        console.log("\n\nWithin the withdrawTokens function");
        uint256 contractBalance = balanceOf(address(this));
        require(contractBalance > 0, "Contract has no tokens left");
        _transfer(address(this), owner, contractBalance);
    }

    function withdrawEth() external onlyOwner {
        console.log("\n\nWithin the withdrawEth function");
        console.log("current balance is for owner: ", owner.balance);

        uint256 contractEthBalance = address(this).balance;
        console.log("Eth balance is for this contract: ", contractEthBalance);
        require(contractEthBalance > 0, "No ETH balance");
        payable(owner).transfer(contractEthBalance);
        console.log("Now the balance is for owner: ", owner.balance);
    }

    function withdrawWETH() external onlyOwner {
        console.log("\n\nWithin the withdrawWeth function");
        console.log("current balance is for owner: ", weth.balanceOf(owner));

        uint256 contractWethBalance = weth.balanceOf(address(this));
        console.log("contractWethBalance is: ", contractWethBalance);

        require(contractWethBalance > 0, "No WETH balance");
        require(
            weth.transfer(owner, contractWethBalance),
            "WETH transfer failed"
        );
        console.log("Updated balance is for owner: ", weth.balanceOf(owner));
    }

    function getUserSQZBalance(
        address userAddress
    ) public view returns (uint256) {
        return balanceOf(userAddress);
    }

    function etherExchangeRate(
        uint256 amountOfEtherOrWETH
    ) public view returns (uint256) {
        console.log("\n\nWithin the etherExchangeRate function");
        console.log("amountOfEtherOrWETH: ", amountOfEtherOrWETH);
        console.log("price: ", price);
        console.log("conversion: ", amountOfEtherOrWETH / price, " SQZ \n\n");

        return amountOfEtherOrWETH / price;
    }
}
