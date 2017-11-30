var Owned = artifacts.require("./Owned.sol");
var NursingHomeDonates = artifacts.require("./Owned.sol");

module.exports = function (deployer, network) {
    if (network == 'development') {
        deployer.deploy(Owned);
        deployer.deploy(NursingHomeDonates);
    }
    else {
        deployer.deploy(NursingHomeDonates);
    }
};
