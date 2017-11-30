var Owned = artifacts.require("Owned");

var emptyAddress = '0x0000000000000000000000000000000000000000';

contract('Owned', function(accounts) {
    it('should test that the Owned contract can be deployed', function() {
        Owned.new()
            .then(instance => assert.ok(instance.address));
    });

    it("owner address should not be empty", function(done) {
        Owned.deployed()
            .then(instance => instance.owner.call())
            .then(ownerAddress => assert.notEqual(ownerAddress, emptyAddress, "owner address is empty"))
            .then(done);
    });

    it("owner address should be equals deployer address", function(done) {
        Owned.deployed().then(instance => instance.owner.call())
            .then(ownerAddress => assert.equal(ownerAddress.valueOf(), accounts[accounts.length - 1], "owner address is not equals deployer address"))
            .then(done);
    });

    it("only owner can change owner", function(done) {
        var owned;

        Owned.deployed()
            .then(function(instance) {
                owned = instance;
                return instance.setOwner.call(accounts[1], { from: accounts[1]});
            })
            .then(_ =>  owned.owner.call())
            .then(ownerAddress => assert.notEqual(ownerAddress.valueOf(), accounts[1], "owner address is set by account not authorized"))
            .then(done);
    });

    it("owner can be set", function(done) {
        var owned;

        Owned.deployed()
            .then(function(instance) {
                owned = instance;
                return instance.setOwner.call(accounts[1]);
            })
            .then(_ =>  owned.owner.call())
            .then(ownerAddress => assert.notEqual(ownerAddress.valueOf(), accounts[1], "Owner address not set by authorized account"))
            .then(done);
    });
});