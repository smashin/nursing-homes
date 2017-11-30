var Deals = artifacts.require("RealEstateDeals");
var RoleBased = artifacts.require("RoleBased");

const emptyAddress = '0x0000000000000000000000000000000000000000';
const developerAccount = '0x00E3d1Aa965aAfd61217635E5f99f7c1e567978f'; // unlocked in chain config
const accountWithoutRole = '0x6B0c56d1Ad5144b4d37fa6e27DC9afd5C2435c3B'; // unlocked in chain config
const bankAccount = '0x0011598De1016A350ad719D23586273804076774'; // unlocked in chain config

const developerRole = 1;
const bankRole = 2; // TODO: find a way to reference Enums

const deletedStatus = 0;
const draftStatus = 1;
const bankCheckRequiredStatus = 2;
const shareAgreementContractType = 1;

contract('RealEstateDeals', function(accounts) {
    before(function() {
        return Deals.deployed().then(instance => instance.assignRole(developerAccount, developerRole))
    });

    it('should test that the RealEstateDeals contract can be deployed', function() {
        Deals.deployed().then(instance => assert.ok(instance.address));
    });

    it('deal info is empty before added', function(done) {
        Deals.deployed().then(function(instance) {
            return instance.getDealInfo.call(1);
        })
        .then(function(info) {
            assert.equal(info[0].toString(), '', 'deal externalId is not empty');
            assert.equal(info[1].toString(), emptyAddress, 'deal creator is not empty');
            assert.equal(info[2].toString(), '', 'deal name is not empty');
            assert.equal(info[3].toNumber(), 0, 'deal status is not empty');
            assert.equal(info[4].toNumber(), 0, 'deal contract type is not empty');
            assert.equal(info[5].toNumber(), 0, 'deal createdAt is not empty');
            assert.equal(info[6].toNumber(), 0, 'deal updateAt is not empty');
            assert.equal(info[7].toNumber(), 0, 'deal fileCount more than 0');
        }).then(done)
    });

    it('deal info is correct after added', function(done) {
        var deals;
        var externalDealId = 'deal1';
        var dealName = 'Test deal 1';
        var prevDealId = 0;
        var dealId = 0;

        Deals.deployed()
            .then(function(instance) {
                deals = instance;
                return deals.addDeal(externalDealId, dealName, shareAgreementContractType, { from: developerAccount });
            })
            .then(addDealResult => {
                var logs = addDealResult.logs[0];
                assert.equal(logs.event, 'DealAdded', 'DealAdded event not fired');
                dealId = logs.args.dealId.toNumber();
            })
            .then(_ => deals.getDealInfo.call(dealId))
            .then(function(info) {
                assert.equal(dealId, prevDealId + 1, 'dealCounter is not incremented')
                assert.equal(info[0].toString().toLowerCase(), externalDealId, 'deal externalId is incorrect');
                assert.equal(info[1].toString().toLowerCase(), developerAccount.toLowerCase(), 'deal creator is incorrect');
                assert.equal(info[2].toString(), dealName, 'deal name is incorrect');
                assert.equal(info[3].toNumber(), draftStatus, 'deal status not equals Draft after added');
                assert.equal(info[4].toNumber(), shareAgreementContractType, 'deal contract type is incorrect');
                assert.isAbove(info[5].toNumber(), 0, 'deal createdAt not set');
                assert.isAbove(info[6].toNumber(), 0, 'deal updateAt not set');
                assert.equal(info[7].toNumber(), 0, 'deal fileCount more than 0');
            })
            .then(done)
    });

    it('account without role can not add deal', function(done) {
        Deals.deployed()
            .then(instance => instance.addDeal('DealN', 'Test deal', shareAgreementContractType, { from: accountWithoutRole }))
            .then(addDealResult => assert.isNotOk(addDealResult.logs[0], 'deal added by account without role'))
            .then(done);
    });

    it('authorized role can add file reference to deal', function(done) {
        var deals;
        var externalDealId = 'deal2';
        var accountsAllowed = [developerAccount];
        var dealId = 0;

        Deals.deployed()
            .then(function(instance) {
                deals = instance;
                return deals.addDeal(externalDealId, 'Test deal with files', shareAgreementContractType, { from: developerAccount });
            })
            .then(addDealResult => {
                var logs = addDealResult.logs[0];
                assert.equal(logs.event, 'DealAdded', 'DealAdded event not fired');
                dealId = logs.args.dealId.toNumber();
            })
            .then(_ => deals.addFileReference(dealId, 'xxx', 'New file reference', 'fileHash1', 'https://filestorage.ru/1', accountsAllowed, { from: developerAccount }))
            .then(addReferenceCallResult => assert.equal(addReferenceCallResult.logs[0].event, 'FileAdded', 'FileAdded event not fired'))
            .then(_ => deals.addFileReference(dealId, 'xxxx', 'New file reference 2', 'fileHash2', 'https://filestorage.ru/2', accountsAllowed, { from: developerAccount }))
            .then(addReferenceCallResult => assert.equal(addReferenceCallResult.logs[0].event, 'FileAdded', 'FileAdded event not fired'))
            .then(_ => deals.getDealInfo.call(dealId))
            .then(info => assert.equal(info[7].toNumber(), 2, 'file count is incorrect'))
            .then(_ => deals.getDealFilesJson.call(dealId))
            .then(files => assert.equal(JSON.parse(files).length, 2, 'file count is wrong in Json'))
            .then(_ => deals.hasFileDownloadPermission.call(developerAccount, dealId, 0))
            .then(p => assert.isOk(p, 'user with role allowed has not download permission'))
            .then(_ => deals.hasFileDownloadPermission.call(accountWithoutRole, dealId, 0))
            .then(p => assert.isNotOk(p, 'user without role has download permission'))
            .then(_ => deals.deleteFileReference(dealId, 0, { from: developerAccount }))
            .then(_ => deals.hasFileDownloadPermission.call(developerAccount, dealId, 0))
            .then(p => assert.isNotOk(p, 'user has download permission to deleted file'))
            .then(done);
    });

    it('account without role can not add file reference to deal', function(done) {
        var deals;
        var externalDealId = 'deal3';
        var rolesAllowed = [developerRole, bankRole];
        var dealId = 0;

        Deals.deployed()
            .then(function(instance) {
                deals = instance;
                return deals.addDeal(externalDealId, 'Test deal with files', shareAgreementContractType, { from: developerAccount });
            })
            .then(addDealResult => {
                var logs = addDealResult.logs[0];
                assert.equal(logs.event, 'DealAdded', 'DealAdded event not fired');
                dealId = logs.args.dealId.toNumber();
            })
            .then(_ => deals.addFileReference(dealId, 'xxx', 'New file reference', 'fileHash', 'https://filestorage.ru', rolesAllowed, { from: accountWithoutRole }))
            .then(result => assert.isNotOk(result.logs[0], 'file reference added by account without role'))
            .then(done);
    });

    it('developer can request bank check', function(done) {
        var deals;
        var dealId = 0;
        var externalDealId = 'Deal5';
        var banks = [];
        banks.push(bankAccount);

        Deals.deployed()
            .then(function(instance) {
                deals = instance;
                return deals.addDeal(externalDealId, 'Test deal with files', shareAgreementContractType, { from: developerAccount });
            })
            .then(addDealResult => {
                var logs = addDealResult.logs[0];
                assert.equal(logs.event, 'DealAdded', 'DealAdded event not fired');
                dealId = logs.args.dealId.toNumber();
            })
            .then(_ => deals.requestBankCheck(dealId, banks, { from: developerAccount }))
            .then(requestBankCheckResult => assert.equal(requestBankCheckResult.logs[0].event, 'DealBankCheckRequested', 'event not fired'))
            .then(_ => deals.deals.call(dealId))
            .then(info => assert.equal(info[3].toNumber(), bankCheckRequiredStatus, 'deal status is wrong'))
            .then(_ => deals.getDealLogsJson.call(dealId))
            .then(logs => assert.equal(JSON.parse(logs).length, 2, 'logs count is wrong in Json'))
            .then(done);
    });
});