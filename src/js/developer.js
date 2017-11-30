// import { Api } from 'parity';
// Web3 = require('web3');
// parity = require('@parity/parity.js');

const EthRpcEndpoint = 'http://127.0.0.1:8545';
const DealContractTypeNames = ['не установлено', 'Договор долевого участия', 'Договор купли-продажи'];
const DealStatusNames = ['Удалено', 'Черновик', 'Проверка банка', 'Отклонено банком', 'Одобрено банком', 'Регистрация в Росреестре', 'Отклонено Росреестром', 'Сделка зарегистрирована', 'Оплачено', 'Завершено']
const DealStatusClasses = ['danger', 'default', 'warning', 'danger', 'info', 'warning', 'danger', 'primary', 'primary', 'success']
const RoleNames = ['Удаленный', 'Застройщик', 'Банк', 'Оценочная компания', 'Страховая компания', 'Росреестр', 'Контролирующий орган'];
const FileSignStatusName = ['Не подписан', 'Подписан клиентом', 'Подписан застройщиком'];
const FileSignStatusClasses = ['danger', 'warning', 'success'];
const BankRole = 2;

FileStorage = {
    token: null,
    basePath: 'Deals',

    init: function (token) {
        FileStorage.token = token;
    },

    createDir: function (name, successCallback) {
        $.ajax({
            url: `https://cloud-api.yandex.net/v1/disk/resources/?path=${name}`,
            method: 'put',
            headers: {
                "Authorization": `OAuth ${FileStorage.token}`
            },
            success: successCallback
        });
    },

    uploadFile: function (path, file, successCallback) {
        $.ajax({
            method: 'get',
            url: `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${path}&overwrite=true`,
            dataType: 'json',
            contentType: 'application/json',
            async: false,
            headers: {
                "Authorization": `OAuth ${FileStorage.token}`
            },
            success: function (data) {
                var formData = new FormData();
                formData.append('file', file);
                $.ajax({
                    method: data.method,
                    url: data.href,
                    data: formData,
                    processData: false,  // tell jQuery not to process the data
                    contentType: false,  // tell jQuery not to set contentType
                    success: function () {
                        $.ajax({
                            method: 'put',
                            url: `https://cloud-api.yandex.net/v1/disk/resources/publish?path=${path}`,
                            headers: {
                                "Authorization": `OAuth ${FileStorage.token}`
                            },
                            success: function () {
                                $.ajax({
                                    method: 'get',
                                    url: `https://cloud-api.yandex.net/v1/disk/resources?path=${path}`,
                                    headers: {
                                        "Authorization": `OAuth ${FileStorage.token}`
                                    },
                                    success: function (file) {
                                        successCallback(file.public_url, file.name, file.md5, file.public_url);
                                    }
                                });
                            }
                        })
                    }
                });
            }
        });
    },

    deleteFile: function (key, successCallback) {
        $.ajax({
            method: 'get',
            url: `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${key}`,
            headers: {
                "Authorization": `OAuth ${FileStorage.token}`
            },
            success: function (file) {
                $.ajax({
                    url: `https://cloud-api.yandex.net/v1/disk/resources?path=${file.path}&permanently=true`,
                    method: 'delete',
                    headers: {
                        "Authorization": `OAuth ${FileStorage.token}`
                    },
                    error: function (err) {
                        console.log(err)
                    },
                    success: function (data) {
                        successCallback();
                    }
                });
            }
        });
    }
}

App = {
    web3Provider: null,
    contracts: {},
    accountsInfo: [],
    roles: [],
    address: null,

    init: function () {
        // Load accounts
        $.ajax({
                method: 'post',
                url: EthRpcEndpoint,
                data: '{"method":"parity_allAccountsInfo","params":[],"id":1,"jsonrpc":"2.0"}',
                contentType: 'application/json',
                crossDomain: true
            }
        ).done(function (data) {
            App.accountsInfo = data.result;
            App.address = $('#address').val();
            $('.j-title').text((App.accountsInfo[App.address.toLowerCase()] || {}).name);
        });

        // Load deals
        return App.initWeb3();
    },

    initWeb3: function () {
        // Initialize web3 and set the provider to the testRPC.
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // set the provider you want from Web3.providers
            App.web3Provider = new Web3.providers.HttpProvider(EthRpcEndpoint);
            web3 = new Web3(App.web3Provider);
        }

        if (!web3.isConnected())
            console.log("not connected");
        else
            console.log("connected");

        return App.initContract();
    },

    initContract: function () {
        $.getJSON('RealEstateDeals.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            var RealEstateDealsArtifact = data;
            App.contracts.RealEstateDeals = TruffleContract(RealEstateDealsArtifact);

            // Set the provider for our contract.
            App.contracts.RealEstateDeals.setProvider(App.web3Provider);

            App.contracts.RealEstateDeals
                .deployed()
                .then(function(instance) {
                    instance.allEvents({}, (e, res) => App.renderDealList());
                });

            App.contracts.RealEstateDeals.deployed()
                .then(function (instance) {
                    var roles = RoleNames.map(function (item, i) {
                        return instance.getAccountsWithRole.call(i)
                            .then(accounts => {
                                return {
                                    roleId: i,
                                    roleName: item,
                                    accounts: accounts.map(address => {
                                        var info = App.accountsInfo[address];
                                        if (info) {
                                            return {
                                                address: address,
                                                name: info.name
                                            };
                                        }
                                    })
                                }
                            });
                    });

                    Promise.all(roles).then(rolesInfo => {
                        App.roles = rolesInfo;
                    });
                })
                .then(App.renderDealList);
        });

        return App.bindEvents();
    },

    bindEvents: function () {
        $(document).on('submit', '.j-form-deal', App.handleAddDeal);
        $(document).on('submit', '.j-form-file', App.handleAddFile);
        $(document).on('click', '.j-deal-register', App.handleRegisterDeal);
        $(document).on('click', '.j-file-delete', App.handleDeleteFile);
        $(document).on('click', '.j-file-sign', App.handleSignFile);
        $(document).on('click', '.j-deal-send', App.handleSendDeal);
        $(document).on('click', '.j-deal-delete', App.handleDeleteDeal);
        $(document).on('click', '.j-deal-files', App.handleShowFiles);
        $(document).on('click', '.j-deal-logs', App.handleShowLogs);
    },

    handleAddDeal: function () {
        $('#error-message').hide();
        var $button = $(event.target).find('button');
        $button.button('loading');
        var dealsInstance;
        var address = $('#address').val();
        var externalId = $('#externalId').val();
        var name = $('#name').val();
        var contractType = $('#contractType').val();
        App.contracts.RealEstateDeals.deployed()
            .then(function (instance) {
                dealsInstance = instance;

                return dealsInstance.addDeal(externalId, name, contractType, {from: address});
            })
            .then(addDealResult => {
                var logs = addDealResult.logs[0];
                dealId = logs.args.dealId.toNumber();
                if (dealId) {
                    $('#success-message').show().fadeOut(3000);
                }
                else {
                    $('#error-message').show()
                }
                $button.button('reset');
            })
            .catch(function (err) {
                $('#error-message').show();
                console.log(err.message);
                $button.button('reset');
            });

        return false;
    },

    handleAddFile: function () {
        var $button = $('.j-form-file button');
        $button.button('loading');
        $('#file-error-message').hide();

        var dealsInstance;
        var address = $('#address').val();
        var id = $('#j-file-deal-id').val();
        var accountsAllowed = $('[name=fileAccountsAllowed]:checked').map(function () {
            return this.value;
        }).get();
        var file = $('#file')[0].files[0];
        var path = `${file.name}`;
        if (!file.name) {
            alert('Выберите файл для загрузки');
            return false;
        }

        var formData = new FormData();
        formData.append('file', file);

        FileStorage.uploadFile(path, file, function (key, name, hash, url) {
            App.contracts.RealEstateDeals.deployed()
                .then(function (instance) {
                    dealsInstance = instance;
                    return dealsInstance.addFileReference(id, key, name, hash, url, accountsAllowed, {from: address});
                })
                .then(result => {
                    var logs = result.logs[0];
                    if (logs.event == 'FileAdded') {
                        $('#file-success-message').show().fadeOut(3000);
                        $button.button('reset');
                        App.renderFileList(id);
                    }
                    else {
                        $('#file-error-message').show()
                    }
                });
        });

        return false;
    },

    handleDeleteFile: function () {
        if (confirm('Вы действительно хотите удалить сведения о файле?')) {
            var $this = $(event.target);
            var dealsInstance;
            var address = $('#address').val();
            var index = $this.parents('tr').data('id');
            var key = $this.parents('tr').data('key');
            var dealId = $('#j-file-deal-id').val();
            FileStorage.deleteFile(key, function () {
                App.contracts.RealEstateDeals.deployed()
                    .then(function (instance) {
                        dealsInstance = instance;
                        return dealsInstance.deleteFileReference(dealId, index, {from: address});
                    })
                    .then(_ => App.renderFileList(dealId))
                    .catch(function (err) {
                        alert(err.message);
                    });
            });
        }

        return false;
    },

    handleSignFile: function () {
        if (confirm('Вы действительно хотите подписать файл?')) {
            var $button = $(event.target);
            $button.button('loading');
            var targetStatus = $button.data('targetStatus');
            var address = $('#address').val();
            var index = $button.parents('tr').data('id');
            var dealId = $('#j-file-deal-id').val();

            App.contracts.RealEstateDeals.deployed()
                .then(function (instance) {
                    dealsInstance = instance;
                    return dealsInstance.setFileSignStatus(dealId, index, targetStatus, {from: address});
                })
                .then(_ => {
                    App.renderFileList(dealId);
                    $button.button('reset');
                })
                .catch(function (err) {
                    $button.button('reset');
                    alert(err.message);
                });
        }

        return false;
    },

    handleRegisterDeal: function () {
        var $this = $(event.target);
        if (confirm(`Вы действительно отправить сделку на регистрацию в Росреестр?`)) {
            var dealsInstance;
            var address = $('#address').val();
            var id = $this.parents('tr').data('id');
            $this.button('loading');
            App.contracts.RealEstateDeals.deployed()
                .then(function (instance) {
                    dealsInstance = instance;
                    return dealsInstance.requestStateRegistration(id, {from: address});
                })
                .then(result => {
                    $this.button('reset');
                    var logs = result.logs[0];
                    if (logs && logs.event != 'DealStateRegistrationRequested') {
                        alert('Ошибка блокчейна при на регистрацию')
                    }
                })
                .catch(function (err) {
                    $this.button('reset');
                    $('#error-message').show();
                    console.log(err.message);
                });

        }

        return false;
    },

    handleSendDeal: function () {
        var $this = $(event.target);
        if (confirm(`Вы действительно отправить заявку в банк ${$this.text()}?`)) {
            var dealsInstance;
            var address = $('#address').val();
            var id = $this.parents('tr').data('id');
            var banks = [];
            banks.push($this.data('address'));
            App.contracts.RealEstateDeals.deployed()
                .then(function (instance) {
                    dealsInstance = instance;
                    return dealsInstance.requestBankCheck(id, banks, {from: address});
                })
                .then(result => {
                    var logs = result.logs[0];
                    if (!logs || logs.event != 'DealBankCheckRequested') {
                        alert('Ошибка при отправке в банк')
                    }
                })
                .catch(function (err) {
                    $('#error-message').show();
                    console.log(err.message);
                });

        }

        return false;
    },

    handleDeleteDeal: function () {
        if (confirm('Вы действительно хотите удалить черновик?')) {
            var dealsInstance;
            var address = $('#address').val();
            var id = $(event.target).parents('tr').data('id');
            App.contracts.RealEstateDeals.deployed()
                .then(function (instance) {
                    dealsInstance = instance;
                    return dealsInstance.deleteDealDraft(id, {from: address});
                })
                .then(result => {
                    var logs = result.logs[0];
                    if (!logs || logs.event != 'DealDraftDeleted') {
                        alert('Ошибка при удалении черновика')
                    }
                })
                .catch(function (err) {
                    $('#error-message').show();
                    console.log(err.message);
                });

        }

        return false;
    },

    handleShowFiles: function () {
        var html = '';
        App.roles.forEach(function (role) {
            if (role != 0 && role.accounts.length > 0) {
                html += `<label class="control-label">${role.roleName}</label>`;
                role.accounts.forEach(function (account) {
                    html += `<div class="checkbox"><label><input type="checkbox" name="fileAccountsAllowed" value="${account.address}">${account.name}</label></div>`
                });
            }
        });

        $('.j-file-accounts-container').html(html);

        var id = $(event.target).parents('tr').data('id');
        App.renderFileList(id);

        return false;

    },

    handleShowLogs: function () {
        var dealsInstance;
        var address = $('#address').val();
        var id = $(event.target).parents('tr').data('id');
        var template = $('#j-logs-popup-template');
        App.contracts.RealEstateDeals.deployed()
            .then(function (instance) {
                dealsInstance = instance;
                return dealsInstance.getDealLogsJson.call(id, {from: address});
            })
            .then(result => {
                var rows = [];
                var logs = JSON.parse(result);
                for (var i = 0; i < logs.length; i++) {
                    var cells = [];
                    cells.push(`<td>${logs[i].creator}</td>`);
                    cells.push(`<td>${dateFormat(new Date(logs[i].createdAt * 1000), "dd.mm.yyyy, HH:MM:ss")}</td>`);
                    cells.push(`<td><span class="label label-${DealStatusClasses[logs[i].status]}">${DealStatusNames[logs[i].status]}</span></td>`);
                    cells.push(`<td>${logs[i].comment}</td>`);
                    rows.push(`<tr class="text-nowrap">${cells.join('\r\n')}</tr>`);
                }

                template.find('.j-logs-popup-deal-id').text(id);
                template.find('.j-logs-popup-text').html(rows.join('\r\n'));
                template.modal('show');
            });

        return false;
    },

    renderFileList: function (dealId) {
        var dealsInstance;
        var address = $('#address').val();
        var template = $('#j-files-popup-template');
        App.contracts.RealEstateDeals.deployed()
            .then(function (instance) {
                dealsInstance = instance;
                return dealsInstance.getDealFilesJson.call(dealId, { from: address });
            })
            .then(result => {
                var rows = [];
                var files = JSON.parse(result);
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file.deleted == "true") continue;
                    var cells = [];
                    cells.push(`<td>${file.index}</td>`);
                    cells.push(`<td><a href="${file.uri}" target="_blank">${file.name}</a></td>`);
                    cells.push(`<td>${file.hash}</td>`);
                    cells.push(`<td>${App.accountsInfo['0x' + file.creator].name}</td>`);
                    var accountsAllowed = file.accountsAllowed.map(function (item) {
                        return App.accountsInfo['0x' + item].name;
                    });
                    cells.push(`<td>${accountsAllowed.join('<br />')}</td>`);
                    cells.push(`<td>${dateFormat(new Date(file.createdAt * 1000), "dd.mm.yyyy, HH:MM:ss")}</td>`);
                    cells.push(`<td><span class="label label-${FileSignStatusClasses[file.signStatus]}">${FileSignStatusName[file.signStatus]}</span></td>`);

                    if (file.signStatus == 0) {
                        cells.push(`<td><button class="btn btn-sm btn-primary j-file-sign" data-target-status="1" data-loading-text="Ожидает подтверждения клиента...">Подписать от клиента</button></td>`);
                    }
                    else if (file.signStatus == 1) {
                        cells.push(`<td><button class="btn btn-sm btn-primary j-file-sign" data-target-status="2" data-loading-text="Ожидает подтверждения менеджера...">Подписать от застройщика</button></td>`);
                    }
                    cells.push(`<td><button class="btn btn-link j-file-delete">Удалить</button></td>`);

                    rows.push(`<tr class="text-nowrap" data-id="${file.index}" data-key="${file.externalId}">${cells.join('\r\n')}</tr>`);
                }

                $('#j-file-deal-id').val(dealId);
                template.find('.j-files-popup-deal-id').text(dealId);
                template.find('.j-files-popup-text').html(rows.join('\r\n'));
                template.modal('show');
            });

    },

    renderDealList: function () {
        var dealsInstance;
        var address = $('#address').val();
        var renderRows = function (deals) {
            var rows = [];
            for (var i = 0; i < deals.length; i++) {
                var deal = deals[i];
                var cells = [];
                cells.push(`<td><button class="btn-link j-deal-logs">${deal.id}</button></td>`);
                cells.push(`<td>${deal.externalId}</td>`);
                cells.push(`<td>${deal.name}</td>`);
                cells.push(`<td>${DealContractTypeNames[deal.contractType]}</td>`);
                cells.push(`<td>${dateFormat(deal.createdAt, "dd.mm.yyyy, HH:MM:ss")}</td>`);
                cells.push(`<td><span class="label label-${DealStatusClasses[deal.status]}">${DealStatusNames[deal.status]}</span></td>`);
                cells.push(`<td><button class="btn-link j-deal-files">${deal.fileCount}</button></td>`);
                var buttons = '';
                if (deal.fileCount == 0) {
                    buttons += '&nbsp;<button class="btn btn-primary j-deal-files">Добавить документы</button>&nbsp';
                }
                else {
                    if (deal.status == 1 || deal.status == 3) {
                        buttons = '<div class="btn-group">';
                        buttons += '<button class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Отправить в банк <span class="caret"></span></button>&nbsp;';
                        buttons += '<ul class="dropdown-menu">';
                        App.roles[BankRole].accounts.forEach(function(item) {
                            buttons += `<li><a href="#" class="j-deal-send" data-address="${item.address}">${item.name}</a></li>`;
                        });
                        buttons += '</ul></div>';
                    }

                    if (deal.status == 1 || deal.status == 4 || deal.status == 6) {
                        buttons += '&nbsp;<button class="btn btn-primary j-deal-register" data-loading-text="Идет отправка...">Отправить в Росреестр</button>&nbsp';
                    }

                    if (deal.status == 7 || deal.status == 8) {
                        buttons += '&nbsp;<button class="btn btn-success j-deal-complete" data-loading-text="Идет отправка...">Завершить</button>&nbsp';
                    }
                }

                if (deal.status == 1) {
                    buttons += '&nbsp;<button class="btn btn-link j-deal-delete">Удалить</button>&nbsp;'
                }

                cells.push(`<td>${buttons}</td>`);
                rows.push(`<tr class="text-nowrap" data-id="${deal.id}">${cells.join('\r\n')}</tr>`);
            }

            return rows.join('\r\n');
        }

        App.contracts.RealEstateDeals.deployed().then(function (instance) {
            dealsInstance = instance;

            return dealsInstance.getCreatorDealIds.call(address);
        }).then(function (dealIds) {
            var deals = dealIds.map(function (item) {
                var dealId = item.toNumber();
                return dealsInstance.getDealInfo.call(dealId)
                    .then(info => {
                        return {
                            id: dealId,
                            externalId: info[0].toString(),
                            name: info[2].toString(),
                            status: info[3].toNumber(),
                            contractType: info[4].toNumber(),
                            createdAt: new Date(info[5].toNumber() * 1000),
                            fileCount: info[7].toNumber()
                        }
                    });
            })

            Promise.all(deals).then(dealsInfo => {
                $('#j-deals-container').html(renderRows(dealsInfo))
            });
        }).catch(function (err) {
            console.error(err.message);
        });
    }

};

$(function () {
    $(window).load(function () {
        FileStorage.init('AQAAAAAgPltWAASFvnvUc6Sf3keCjHE6R0gG0Ps');
        App.init();
    });
});
