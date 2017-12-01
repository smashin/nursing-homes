const EthRpcEndpoint = 'http://78.24.223.194:8545';
const address = "0x6B0c56d1Ad5144b4d37fa6e27DC9afd5C2435c3B";
const donated = JSON.parse(localStorage.getItem('donated')) || []

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

            var number;

            App.contracts.NursingHomeDonates.deployed()
                .then(function (instance) {
                    dealsInstance = instance;
                    return dealsInstance.donatesCount.call({from: address});
                })
                .then(info => number = info.toNumber())
                .then(function (instance) {
                    var arr = new Array(number);
                    var requests = arr.map(function (item, i) {
                        return instance.donates.call(i)
                            .then(d => {
                                return d;
                            });
                    });

                    Promise.all(requests).then(donateInfo => {
                        donates = donateInfo;
                    });
                })
                .then(App.renderContent);
        })
    },

    containsInDonated: function(n){
        for(var i = 0; i < donated.length; i ++) {
            if (donated[i].nursingHome == n) {
                return donated[i];
            }
        }
    },

    renderContent: function () {
        var homes = data.sort(
            function (a, b) {
                var keyA = parseInt(a['Лот'])
                var keyB = parseInt(b['Лот'])
                // Compare the 2 dates
                if (keyA < keyB) return -1
                if (keyA > keyB) return 1
                return 0
            }
        )


        var html = []
        html.push('<table style="width: 100%" cellpadding="8" cellspacing="8">')
        for (var i = 0; i < homes.length; i++) {
            var id = homes[i]['Лот'];
            var amount = homes[i]['Стоимость'];
            if (id % 5 == 1) {
                html.push('<tr>')
            }

            var imgText = `<td><a href="/donate.html?id=${id}&amount=${amount}"><img src="/img/${id}.jpg" width="100%" `
            if (App.containsInDonated(id)) {
                imgText += 'style="-webkit-filter: grayscale(100%);filter: grayscale(100%)"';
                // imgText += 'style="background: White;text-align: left;font: 18px bold;width:180px;height:44px!important;margin: 0;position:relative;left:37%;z-index:999;top:-110px;'
            }

            imgText += '/></a></td>'
            html.push(imgText)

            if (id % 5 == 0) {
                html.push('</tr>')
            }
        }

        html.push('</table>')
        var htmlText = html.join('\r\n')

        document.write(htmlText)
    }
}

window.addEventListener('load', function () {
    App.renderContent();
});