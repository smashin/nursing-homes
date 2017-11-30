// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
// import $ from 'jquery'

// Import our contract artifacts and turn them into usable abstractions.
import contract_artifacts from '../../build/contracts/NursingHomeDonates.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var NursingHomeDonates = contract(contract_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var nsId;

window.App = {
  getParameterByName: function (name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  },

  start: function() {
    // Bootstrap the MetaCoin abstraction for Use.
    App.contracts.NursingHomeDonates.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        console.log("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        console.log("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }
    });

    App.bindEvents();
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

    // setTimeout(function(){
    //   var donated = JSON.parse(localStorage.getItem("donated")) || [];
    //   donated.push(nsId);
    //   localStorage.setItem("donated", JSON.stringify(donated));
    //
    //   $('#success-message').show().fadeOut(3000);
    //   $button.button('reset');
    //
    //   setTimeout(function () {
    //     location.href = 'donated.html';
    //   }, 1000)
    // }, 3000);


    App.contracts.NursingHomeDonates.deployed()
          .then(function (instance) {
              inst = instance;

              return inst.donate(nsId.toString(), $('#donator'), $('#amount'), { from: address });
          })
          .then(result => {
              var logs = addDealResult.logs[0];
              console.log(result)
              // dealId = logs.args.dealId.toNumber();
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

  bindEvents: function () {
    $(document).on('submit', 'form', App.handleDonate);
  },

  // setStatus: function(message) {
  //   var status = document.getElementById("status");
  //   status.innerHTML = message;
  // },
  //
  // refreshBalance: function() {
  //   var self = this;
  //
  //   var meta;
  //   NursingHomeDonates.deployed().then(function(instance) {
  //     meta = instance;
  //     return meta.getBalance.call(account, {from: account});
  //   }).then(function(value) {
  //     var balance_element = document.getElementById("balance");
  //     balance_element.innerHTML = value.valueOf();
  //   }).catch(function(e) {
  //     console.log(e);
  //     self.setStatus("Error getting balance; see log.");
  //   });
  // },
  //
  // sendCoin: function() {
  //   var self = this;
  //
  //   var amount = parseInt(document.getElementById("amount").value);
  //   var receiver = document.getElementById("receiver").value;
  //
  //   this.setStatus("Initiating transaction... (please wait)");
  //
  //   var meta;
  //   NursingHomeDonates.deployed().then(function(instance) {
  //     meta = instance;
  //     return meta.sendCoin(receiver, amount, {from: account});
  //   }).then(function() {
  //     self.setStatus("Transaction complete!");
  //     self.refreshBalance();
  //   }).catch(function(e) {
  //     console.log(e);
  //     self.setStatus("Error sending coin; see log.");
  //   });
  // }
};

window.addEventListener('load', function() {
  nsId = App.getParameterByName('id');
  var amount = App.getParameterByName('amount');
  $('#imgNursingHome').attr('src', `img/${nsId}.jpg`);
  $('#nursingHomeId').val(nsId);
  $('#Amount').val(amount);

  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://78.24.223.194:8545"));
  }

  App.start();
});
