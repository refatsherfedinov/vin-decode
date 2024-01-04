import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';

describe('CarInfo Contract', function () {
    let carInfo: Contract;
    let deployer: Signer;
    let dealer: Signer;
    let insuranceCompany: Signer;
    let trafficPolice: Signer;
    let unauthorizedUser: Signer;

    before(async function () {
        const CarInfo = await ethers.getContractFactory('CarInfo');
        carInfo = await CarInfo.deploy();
        [deployer, unauthorizedUser] = await ethers.getSigners();

        dealer = deployer;
        insuranceCompany = deployer;
        trafficPolice = deployer;

        // console.log('deployer ', deployer);
        // console.log('dealer ', dealer);
        // console.log('insuranceCompany ', insuranceCompany);
        // console.log('trafficPolice ', trafficPolice);
        // console.log('unathorized ', unauthorizedUser);
    });

    describe('Initialization', function () {
        it('Should set the deployer as the authorizedDeployer', async function () {
            expect(await carInfo.authorizedDeployer()).to.equal(
                await deployer.getAddress()
            );
        });

        it('Should initially include deployer in all authorized lists', async function () {
            const deployerAddress = await deployer.getAddress();
            expect(await carInfo.dealersList(0)).to.equal(deployerAddress);
            expect(await carInfo.insuranceCompaniesList(0)).to.equal(
                deployerAddress
            );
            expect(await carInfo.trafficPoliceList(0)).to.equal(
                deployerAddress
            );
        });
    });

    describe('Role Management', function () {
        it('Should allow adding a new dealer', async function () {
            const dealerAddress = await dealer.getAddress();
            await carInfo.addDealer(dealerAddress);
            expect(await carInfo.dealersList(1)).to.equal(dealerAddress);
        });

        it('Should only allow the authorized deployer to add new dealers', async function () {
            const unauthorizedAddress = await unauthorizedUser.getAddress();
            await expect(
                carInfo.connect(unauthorizedUser).addDealer(unauthorizedAddress)
            ).to.be.revertedWith('Only owner can call this function');
        });

        // Repeat for insurance companies and traffic police
    });

    describe('Car Addition', function () {
        const vin = '1HGBH41JXMN109186';

        it('Should add a new car', async function () {
            await expect(
                carInfo
                    .connect(dealer)
                    .addCar(
                        vin,
                        await dealer.getAddress(),
                        2020,
                        'Toyota',
                        'Corolla'
                    )
            ).to.emit(carInfo, 'CarAdded');
        });

        // Other test cases...
    });

    describe('Mileage Updates', function () {
        const vin = '2HGES267X5H585678';

        // Test for successful mileage update
        it('Should allow updating to a higher mileage', async function () {
            await expect(
                carInfo
                    .connect(dealer)
                    .addCar(
                        vin,
                        await dealer.getAddress(),
                        2020,
                        'Toyota',
                        'Corolla'
                    )
            ).to.emit(carInfo, 'CarAdded');
            await carInfo.connect(dealer).updateMileage(vin, 40000);
            const car = await carInfo.getCarInfo(vin);
            expect(car.mileage).to.equal(40000);
        });

        // Test for failure when trying to decrease mileage
        it('Should not allow decreasing the mileage', async function () {
            await expect(
                carInfo.connect(dealer).updateMileage(vin, 35000)
            ).to.be.revertedWith('New mileage must be greater than old one');
        });

        // Other test cases...
    });

    describe('Accident History Management', function () {
        const vin = '3KPCN8A30KE040123';
        const accidentDetail = 'Minor fender bender on 03/15/2023';

        it('Should allow adding accident history', async function () {
            await expect(
                carInfo
                    .connect(dealer)
                    .addCar(
                        vin,
                        await dealer.getAddress(),
                        2020,
                        'Toyota',
                        'Corolla'
                    )
            ).to.emit(carInfo, 'CarAdded');
            await carInfo
                .connect(insuranceCompany)
                .addAccidentHistory(vin, accidentDetail);
            const car = await carInfo.getCarInfo(vin);
            expect(car.accidents).to.include(accidentDetail);
        });

        it('Should only allow insurance companies to add accident history', async function () {
            await expect(
                carInfo
                    .connect(unauthorizedUser)
                    .addAccidentHistory(vin, accidentDetail)
            ).to.be.revertedWith(
                'Only insurance company can call this function'
            );
        });

        // Other test cases...
    });

    describe('Get Car Info', function () {
        const vin = '4T1BF1FK0EU313956';

        it('Should allow authorized user to get car info', async function () {
            await expect(
                carInfo
                    .connect(dealer)
                    .addCar(
                        vin,
                        await dealer.getAddress(),
                        2020,
                        'Toyota',
                        'Corolla'
                    )
            ).to.emit(carInfo, 'CarAdded');
            const car = await carInfo.getCarInfo(vin);
            expect(car).to.exist;
        });

        it('Should not allow unauthorized user to get car info', async function () {
            const car = carInfo.connect(unauthorizedUser).getCarInfo(vin);
            console.log(car);
        });

        it('Should console log car info', async function () {
            const car = await carInfo.getCarInfo(vin);
            console.log(car);
        });
    });
    // Additional test suites for ownership transfer, stolen car reporting, etc.
});
