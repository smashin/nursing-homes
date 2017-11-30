const EthRpcEndpoint = 'http://127.0.0.1:8545';

App = {
    web3Provider: null,
    contracts: {},
    accountsInfo: [],
    roles: [],
    dealIds: [],
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
            App.address = $('#address').val().toLowerCase();
            $('.j-title').text((App.accountsInfo[App.address] || {}).name);
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
            App.contracts.RealEstateDeals.deployed()
                .then(App.renderContent);
        });

        return App.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '.j-deal-approve', App.handleApproveDeal);
        $(document).on('click', '.j-deal-decline', App.handleDeclineDeal);
    },

    renderContent: function () {
        var $container = $('.j-deals-container');
        var $counter = $('.j-deals-count');
        App.contracts.RealEstateDeals
            .deployed()
            .then(function (instance) {
                var dealsInstance = instance;
                var event = instance.DealBankCheckRequested({});
                // watch for changes
                event.watch(function (error, result) {
                    if (!error) {
                        var dealId = result.args.dealId.toNumber();
                        if (App.dealIds.indexOf(dealId) > -1) {
                            return;
                        }

                        App.dealIds.push(dealId);
                        $counter.text(parseInt($counter.text()) + 1);
                        return dealsInstance.getDealFilesJson.call(dealId, {from: App.address})
                            .then(files => {
                                var files = JSON.parse(files);
                                var dealHtml = `<div class="panel panel-info j-deal" data-id="${dealId}">`;
                                dealHtml += `<div class="panel-heading"><h3 class="panel-title">Запрос #${dealId}</div>`
                                var filesHtml = files.map(function (file) {
                                    if (file.accountsAllowed.indexOf(App.address) > -1) {
                                        return `<li class="list-group-item"><a href="${file.uri}" target="_blank">${file.name}</a></li>`;
                                    }
                                });
                                dealHtml += `<div class="panel-body"><h4>Документы</h4><ul class="list-group">${filesHtml.join('\r\n')}</ul>`;
                                dealHtml += '<div>' +
                                    '<button class="btn btn-success j-deal-approve" data-loading-text="Идет сохранение...">Подтвердить наличие средств</button>&nbsp;' +
                                    '<button class="btn btn-danger j-deal-decline" data-loading-text="Идет сохранение...">Отклонить</button>' +
                                    '</div>';
                                dealHtml += '</div></div>';
                                $container.prepend(dealHtml);
                            });

                    }
                });
            });
    },

    handleApproveDeal: function () {
        if (confirm(`Вы подтверждате наличие средств?`)) {
            var $button = $(event.target);
            var $counter = $('.j-deals-count');
            $button.button('loading');
            var dealsInstance;
            var address = $('#address').val();
            var id = $button.parents('.j-deal').data('id');
            App.contracts.RealEstateDeals.deployed()
                .then(function (instance) {
                    dealsInstance = instance;
                    return dealsInstance.approveBankCheck(id, {from: address});
                })
                .then(result => {
                    $button.button('reset');
                    var logs = result.logs[0];
                    if (logs && logs.event == 'DealBankCheckApproved') {
                        $counter.text(parseInt($counter.text()) - 1);
                        $button.closest('.j-deal').remove();
                    }
                    else {
                        alert('Ошибка блокчейна')
                    }
                })
                .catch(function (err) {
                    $button.button('reset');
                    console.log(err.message);
                });

        }

        return false;
    },

    handleDeclineDeal: function () {
        if (confirm(`Вы действительно хотите отклонить сделку?`)) {
            var $button = $(event.target);
            var $counter = $('.j-deals-count');
            $button.button('loading');
            var dealsInstance;
            var address = $('#address').val();
            var id = $button.parents('.j-deal').data('id');
            App.contracts.RealEstateDeals.deployed()
                .then(function (instance) {
                    dealsInstance = instance;
                    return dealsInstance.rejectBankCheck(id, 'Причина отказа банка', {from: address});
                })
                .then(result => {
                    $button.button('reset');
                    var logs = result.logs[0];
                    if (logs && logs.event == 'DealBankCheckRejected') {
                        $counter.text(parseInt($counter.text()) - 1);
                        $button.closest('.j-deal').remove();
                    }
                    else {
                        alert('Ошибка блокчейна регистрации')
                    }
                })
                .catch(function (err) {
                    $button.button('reset');
                    console.log(err.message);
                });

        }

        return false;
    },
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});