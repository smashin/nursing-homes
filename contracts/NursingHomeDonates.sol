pragma solidity ^0.4.18;

import "./Owned.sol";

contract NursingHomeDonates is Owned {
    struct Donate {
        uint amount;
        string nursingHome;
        string donator;
        string contacts;
        uint timestamp;
    }

    Donate[] public donates;
    mapping(bytes32 => uint) nursingHomes;
    mapping(bytes32 => uint) donators;

    event Donated(string donator, uint amount, string nursingHome);

    function donate(string _nursingHome, string _donator, uint _amount, string contacts) onlyOwner() {
        require(bytes(_nursingHome).length > 0);
        require(bytes(_donator).length > 0);
        require(_amount > 0);

        var d = Donate({
            nursingHome: _nursingHome,
            amount: _amount,
            donator: _donator,
            contacts: contacts,
            timestamp: now
        });

        donates.push(d);
        donators[stringToBytes32(_donator)] += _amount;
        nursingHomes[stringToBytes32(_nursingHome)] += _amount;

        Donated(_donator, _amount, _nursingHome);
    }

    function donatesCount() constant returns (uint) {
        return donates.length;
    }

    function donatesTotal() constant returns (uint) {
        uint result = 0;
        for (var i = 0;i < donates.length;i++) {
            result += donates[i].amount;
        }

        return result;
    }

    function nursingHomeDonationAmount(string _name) constant returns(uint) {
        return nursingHomes[stringToBytes32(_name)];
    }

    function donatorDonationAmount(string _donator) constant returns(uint) {
        return donators[stringToBytes32(_donator)];
    }

    function stringToBytes32(string memory _source) private returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(_source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(_source, 32))
        }
    }
}