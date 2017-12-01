require('babel-register');

module.exports = {
    networks: {
        development: {
            host: process.env.RPC_HOST || "127.0.0.1",
            port: process.env.RPC_PORT || 8545,
            from: "0x6B0c56d1Ad5144b4d37fa6e27DC9afd5C2435c3B",
            gas: 47000000,
            network_id: "*" // Match any network id
        },
        stage: {
            host: "78.24.223.194",
            port: 8545,
            from: "0x6B0c56d1Ad5144b4d37fa6e27DC9afd5C2435c3B",
            network_id: "8995",
            gas: 47000000,
            // optional config values:
            // gas
            // gasPrice
            // from - default address to use for any transaction Truffle makes during migrations
            // provider - web3 provider instance Truffle should use to talk to the Ethereum network.
            //          - if specified, host and port are ignored.
        }
    }
};
