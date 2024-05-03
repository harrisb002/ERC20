// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

//Whoever deploys this contract is the one who wants to sell their token
//They will send the address of the token contract to this contract to say
//what token they want to sell. Can be extended so that anyone can sell any token.
contract DEX {
    ERC20 public associatedToken;
    IERC20 public weth; // Instance of the WETH contract
    uint price;
    address owner;

    //Must send a token that adheres to this interface
    //Once passed, it will load that contract within this contract
    //Allowing the access of the methods attached to the interface
    constructor(ERC20 _token, IERC20 _weth, uint _price) {
        associatedToken = _token; // Get IERC20 contract instance to use interface using the Squares contract
        weth = _weth; // Set the WETH contract instance
        owner = msg.sender;
        price = _price;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Transfer(address indexed from, address indexed to, uint256 value);

    function transferSQZAllowance() external onlyOwner {
        uint allowance = associatedToken.allowance(msg.sender, address(this)); //Check how many tokens have access to(their allowance)
        require(
            allowance > 0,
            "Must give the DEX contract a WETH allowance of at least one token"
        );
        emit Approval(msg.sender, address(this), allowance);

        bool sent = associatedToken.transferFrom(
            msg.sender,
            address(this),
            allowance
        );
        require(sent, "Failed to send the tokens");
        emit Transfer(msg.sender, address(this), allowance);
    }

    function transferWethAllowance() external onlyOwner {
        uint allowance = weth.allowance(msg.sender, address(this));
        require(
            allowance > 0,
            "Must give the DEX contract a WETH allowance of at least one token"
        );
        emit Approval(msg.sender, address(this), allowance);

        bool sent = weth.transferFrom(msg.sender, address(this), allowance);
        require(sent, "Failed to send the tokens");
        emit Transfer(msg.sender, address(this), allowance);
    }

    function buyTokensUsingEther() external payable {
        require(msg.value > 0, "\nMust send ETH");
        uint256 tokensToBuy = etherExchangeRate(msg.value);
        uint256 addrSqzAllowance = getSqzTokenBalance();
        require(
            addrSqzAllowance >= tokensToBuy,
            "\nMust DEX contract must have SQZ allowance >= tokensToBuy"
        );
        associatedToken.transfer(msg.sender, tokensToBuy);
        emit Transfer(address(this), msg.sender, tokensToBuy);
    }

    function buyTokensUsingWETH(uint256 amountOfWETH) external {
        require(amountOfWETH > 0, "\nMust send WETH");

        uint256 tokensToBuy = etherExchangeRate(amountOfWETH);
        uint256 addrSqzAllowance = getSqzTokenBalance();
        uint256 addrWethAllowance = getWethTokenBalance();

        require(
            addrSqzAllowance >= tokensToBuy,
            "\nMust DEX contract must have SQZ allowance >= tokensToBuy"
        );

        require(
            addrWethAllowance >= amountOfWETH,
            "\nMust DEX contract must have WETH allowance >= amount of sent WETH"
        );

        // Transfer WETH from to this contract in the amount
        bool wethReceived = weth.transfer(address(this), amountOfWETH);
        require(wethReceived, "WETH transfer failed");
        // Transfer(from, to, amount)
        emit Transfer(address(weth), address(this), tokensToBuy);

        // Send the transaction owner the amount of tokens
        bool sqzRecieved = associatedToken.transfer(msg.sender, tokensToBuy);
        require(sqzRecieved, "SQZ transfer failed");
        emit Transfer(address(this), msg.sender, tokensToBuy);
    }

    //The owner is able to withdraw tokens at anytime
    function withdrawTokens() external onlyOwner {
        uint256 contractSQZBalance = getSqzTokenBalance();
        require(contractSQZBalance > 0, "Contract must posses SQZ");

        associatedToken.transfer(msg.sender, contractSQZBalance);
        emit Transfer(address(this), msg.sender, contractSQZBalance);
    }

    // Withdraw all of the Eth balance from contract
    function withdrawEth() external onlyOwner {
        uint256 contractEthBalance = address(this).balance;
        require(contractEthBalance > 0, "Contract must posses ETH");

        (bool sent, ) = owner.call{value: contractEthBalance}("");
        require(sent, "Transaction failed");
        emit Transfer(address(this), owner, contractEthBalance);
    }

    // Withdraw all of the Weth balance from contract
    function withdrawWeth() external onlyOwner {
        uint256 contractWethBalance = weth.balanceOf(address(this));
        require(contractWethBalance > 0, "Contract must posses WETH");

        bool sent = weth.transfer(payable(owner), contractWethBalance);
        require(sent, "Transaction failed");
        emit Transfer(address(this), owner, address(this).balance);
    }

    // Returns the number of tokens the contract will give to the sender in exchange for
    // amountOfEtherOrWETH, which is a number representing a specific amount of Ether or WETH
    function etherExchangeRate(
        uint amountOfEtherOrWETH
    ) public view returns (uint) {
        uint amountTokens = amountOfEtherOrWETH / price;
        return amountTokens;
    }

    // Returing the Allowance of SQZ for the passed address (assumed) contract
    function getSqzTokenBalance() public view returns (uint) {
        uint amount = associatedToken.balanceOf(address(this));
        return amount;
    }

    // Returing the Allowance of WETH for the passed address (assumed) contract
    function getWethTokenBalance() public view returns (uint) {
        uint amount = weth.balanceOf(address(this));
        return amount;
    }
}
