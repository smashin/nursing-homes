pragma solidity ^0.4.18;

import "./Owned.sol";

contract Migrations is Owned {
  uint public last_completed_migration;

  function Migrations() {
    owner = msg.sender;
  }

  function setCompleted(uint completed) onlyOwner {
    last_completed_migration = completed;
  }

  function upgrade(address new_address) onlyOwner {
    Migrations upgraded = Migrations(new_address);
    upgraded.setCompleted(last_completed_migration);
  }
}
