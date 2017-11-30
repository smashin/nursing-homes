pragma solidity ^0.4.13;

contract Owned {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function Owned() {
        owner = msg.sender;
    }

    function setOwner(address _newOwner) onlyOwner {
        owner = _newOwner;
    }
}