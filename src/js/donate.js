const EthRpcEndpoint = 'http://78.24.223.194:8545';
const address = "0x6B0c56d1Ad5144b4d37fa6e27DC9afd5C2435c3B";

var nsId;

window.App = {
    web3Provider: null,
    contracts: {},

    getParameterByName: function (name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';

        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },

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

            App.bindEvents();
        })
    },

    handleDonate: function () {
        var $form = $(event.target);
        var $button = $form.find('button');

        var form = document.getElementById('donate-form');
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');

        $button.button('loading');

        App.contracts.NursingHomeDonates.deployed()
            .then(function (instance) {
                inst = instance;console.log($('#contacts').val())

                return inst.donate(
                    nsId.toString(),
                    $('#donator').val(),
                    parseInt($('#Amount').val()),
                    $('#contacts').val(), {from: address});
            })
            .then(result => {
                var logs = result.logs[0];
                var tx = result.tx;
                if (tx) {
                    $('#success-message').html(`Сведения успешно сохранены в блокчейн. Транзакция <small>${tx}</small>`).show().fadeOut(8000);
                    var donated = JSON.parse(localStorage.getItem("donated")) || [];
                    donated.push(logs.args);
                    localStorage.setItem("donated", JSON.stringify(donated));
                    setTimeout(function() { location.href = 'index.html'} , 8000);
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

    bindEvents: function () {
        $(document).on('submit', 'form', App.handleDonate);
    },

};

window.addEventListener('load', function () {
    nsId = App.getParameterByName('id');
    var amount = App.getParameterByName('amount');
    $('#imgNursingHome').attr('src', `img/${nsId}.jpg`);
    $('#nursingHomeId').val(nsId);
    $('#Amount').val(amount);

    App.init();
});
