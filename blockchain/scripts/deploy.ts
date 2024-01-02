// Import ethers from Hardhat package
const { ethers } = require('hardhat');

async function main() {
    // Compile our contract
    // await hre.run('compile');
    const IS_TEST = true;
    // Get the Contract Factory for our CarInfo contract

    const contractsNames: string[] = [
        // 'CarData',
        // 'AccessControl',
        // 'DealerManagement',
        // 'TrafficPoliceManagement',
        // 'InsuranceManagement',
        'VinDecode',
    ];

    for (let i = 0; i < contractsNames.length; i++) {
        const Contract = await ethers.getContractFactory(contractsNames[i]);
        const contract = await Contract.deploy(IS_TEST);

        await contract.deployed();
        console.log(`${contractsNames[i]} deployed to: ${contract.address}`);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
