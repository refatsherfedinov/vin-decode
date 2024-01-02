import 'dotenv/config';
require('@nomiclabs/hardhat-waffle');
module.exports = {
    networks: {
        sepolia: {
            url: process.env.ALCHEMY_SEPOLIA_URL,
            accounts: [process.env.SEPOLIA_PRIVATE_KEY],
        },
    },
    solidity: {
        version: '0.8.20',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    paths: {
        sources: './contracts',
        tests: './test',
        cache: './cache',
        artifacts: './artifacts',
    },
    mocha: {
        timeout: 40000,
    },
};
