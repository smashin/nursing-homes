var Owned = artifacts.require("./Owned.sol");
var NursingHomeDonates = artifacts.require("./NursingHomeDonates.sol");

module.exports = function (deployer, network) {
    console.log(network, ' - network')
    if (network != 'stage') {
        deployer.deploy(Owned);
        deployer.deploy(NursingHomeDonates);
    }
    else {
        deployer.deploy(NursingHomeDonates);
    }
};
