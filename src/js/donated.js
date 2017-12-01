const EthRpcEndpoint = 'http://78.24.223.194:8545';
const address = "0x6B0c56d1Ad5144b4d37fa6e27DC9afd5C2435c3B";

window.App = {
    web3Provider: null,
    contracts: {},

    init: function () {
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
        $.getJSON('NursingHomeDonates.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            var artifact = data;
            App.contracts.NursingHomeDonates = TruffleContract(artifact);

            // Set the provider for our contract.
            App.contracts.NursingHomeDonates.setProvider(App.web3Provider);
            App.contracts.NursingHomeDonates.deployed()
                .then(App.renderContent);

            App.bindEvents();
        })
    },

    renderContent: function () {
        var $donator = $('.name');
        var $tx = $('#tx');
        var $amount = $('.amount');
        App.contracts.NursingHomeDonates
            .deployed()
            .then(function (instance) {
                var dealsInstance = instance;
                var event = instance.Donated({});
                // watch for changes
                event.watch(function (error, result) {
                    if (!error) {
                        console.log(result);
                        var amount = result.args.amount.toNumber().toLocaleString('ru-RU');
                        var donator = result.args.donator;
                        var tx = result.transactionHash;

                        $amount.html(`${amount} &#8381;`);
                        $donator.text(donator);
                        $tx.text(tx);
                    }
                });
            });
    }
};

window.addEventListener('load', function () {
    App.init();
});
