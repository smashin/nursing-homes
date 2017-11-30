var RoleBased = artifacts.require("RoleBased");
var Enums = artifacts.require("Enums");

var account = '0x00E3d1Aa965aAfd61217635E5f99f7c1e567978f';
var developerRole = 1;
var bankRole = 2; // TODO: find a way to reference Enums

contract(['RoleBased'], function(accounts) {
    before(function() {
        return Enums.deployed().then(function(i) { console.log(i.Role)} );
    })

    it('should test that the RoleBased contract can be deployed', function(){
        RoleBased.new()
            .then(instance => assert.ok(instance.address));
    });

    it('role is not assigned when deployed', function(done) {
        RoleBased.deployed()
            .then(instance => instance.isAssignedRole.call(account, developerRole))
            .then(roleAssigned => assert.isNotOk(roleAssigned.valueOf(), "Role was assigned when contract was deployed"))
            .then(done);
    });

    it('only owner can assign role', function(done) {
        var roles;

        RoleBased.deployed()
            .then(function(instance) {
                roles = instance;
                return instance.assignRole(account, developerRole, { from: account });
            })
            .then(_ => roles.isAssignedRole.call(account, developerRole))
            .then(roleAssigned => assert.isNotOk(roleAssigned.valueOf(), "Role was assigned by account not authorized"))
            .then(done);
    });

    it('role can be assigned', function(done) {
        var roles;

        RoleBased.deployed().then(function(instance) {
            roles = instance;
            return instance.assignRole(accounts[1], developerRole);
        })
        .then(_ => roles.isAssignedRole.call(accounts[1], developerRole))
        .then(roleAssigned => assert.isOk(roleAssigned.valueOf(), "Role has not been assigned"))
        .then(done);
    });

    it('Only owner can unassign role', function(done) {
        var roles;

        RoleBased.deployed().then(function(instance) {
            roles = instance;
            return instance.assignRole(accounts[1], developerRole);
        })
        .then(_ => roles.isAssignedRole.call(accounts[1], developerRole))
        .then(roleAssigned => assert.isOk(roleAssigned.valueOf(), "Role has not been assigned"))
        .then(_ => roles.unassignRole(accounts[1], developerRole, { from: account }))
        .then(_ => roles.isAssignedRole.call(accounts[1], developerRole))
        .then(roleAssigned => assert.isOk(roleAssigned.valueOf(), "Role was unassigned by account not authorized"))
        .then(done);
    });

    it('Role can be unassigned', function() {
        var contractInstance;

        return RoleBased.deployed().then(function(instance) {
            contractInstance = instance;
            return instance.assignRole(accounts[1], developerRole);
        }).then(_ => contractInstance.isAssignedRole.call(accounts[1], developerRole))
        .then(roleAssigned => assert.isOk(roleAssigned.valueOf(), "Role has not been assigned"))
        .then(_ => contractInstance.unassignRole(accounts[1], developerRole))
        .then(_ => contractInstance.isAssignedRole.call(accounts[1], developerRole))
        .then(roleAssigned => assert.isNotOk(roleAssigned.valueOf(), "Role was not unassigned"));
    });

    it('Two roles can be assigned', function() {
        var contractInstance;
        var developerRoleIsAssigned = false;
        var bankRoleIsAssigned = false;

        return RoleBased.deployed().then(function (instance) {
            contractInstance = instance;
            return instance.assignRole(accounts[1], developerRole);
        }).then(_ => contractInstance.assignRole(accounts[1], bankRole))
        .then(_ => contractInstance.isAssignedRole.call(accounts[1], developerRole))
        .then(roleAssigned => developerRoleIsAssigned = roleAssigned.valueOf())
        .then(_ => contractInstance.isAssignedRole.call(accounts[1], bankRole))
        .then(roleAssigned => bankRoleIsAssigned = roleAssigned.valueOf())
        .then(function() {
            assert.isOk(developerRoleIsAssigned, "First role was not assigned");
            assert.isOk(bankRole, "Second role was not assigned");
        });
    });
});