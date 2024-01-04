// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
import "./CarTypes.sol";

contract VinDecode {
    using CarTypes for CarTypes.Fine;
    using CarTypes for CarTypes.Accident;
    using CarTypes for CarTypes.ServiceWork;
    using CarTypes for CarTypes.Theft;
    using CarTypes for CarTypes.Car;

    event AccidentAdded(string vin, CarTypes.Car car);
    event CarAdded(string vin, CarTypes.Car car);
    event CarReportedFound(string vin, CarTypes.Car car);
    event CarReportedStolen(string vin, CarTypes.Car car);
    event DealerAdded(address dealer);
    event FinesAdded(string vin, CarTypes.Car car);
    event FinePaid(string vin, CarTypes.Car car);
    event InsuranceCompanyAdded(address insuranceCompany);
    event NewOwnerAdded(string vin, CarTypes.Car car);
    event PlateChanged(string vin, CarTypes.Car car);
    event ServiceHistoryUpdated(string vin, CarTypes.Car car);
    event TrafficPoliceAdded(address trafficPolice);
    event ReportPurchased(string vin, CarTypes.Car car);

    modifier onlyGovernment() {
        require(msg.sender == state, "Only government can call this function");
        _;
    }

    modifier onlyDealer() {
        require(isDealer[msg.sender], "Only dealer can call this function");
        _;
    }

    modifier onlyInsuranceCompany() {
        require(
            isInsuranceCompany[msg.sender],
            "Only insurance company can call this function"
        );
        _;
    }

    modifier onlyTrafficPolice() {
        require(
            isTrafficPolice[msg.sender],
            "Only traffic police can call this function"
        );
        _;
    }

    mapping(string => CarTypes.Car) internal cars;
    address payable public state;
    mapping(address => bool) public isDealer;
    mapping(address => bool) public isInsuranceCompany;
    mapping(address => bool) public isTrafficPolice;
    bool public isTestEnvironment;

    constructor(bool _isTestEnvironment) {
        isTestEnvironment = _isTestEnvironment;
        state = payable(msg.sender);
        isDealer[msg.sender] = true;
        isInsuranceCompany[msg.sender] = true;
        isTrafficPolice[msg.sender] = true;
    }

    function ACTIVATE_SUPER_USER() external {
        require(isTestEnvironment, "Only for testing purposes");
        require(
            !(isDealer[msg.sender] &&
                isInsuranceCompany[msg.sender] &&
                isTrafficPolice[msg.sender]),
            "Address is already allowed to be admin"
        );
        isDealer[msg.sender] = true;
        isInsuranceCompany[msg.sender] = true;
        isTrafficPolice[msg.sender] = true;
    }

    function addDealer(address dealer) public onlyGovernment {
        require(!isDealer[dealer], "Dealer already added");
        isDealer[dealer] = true;
        emit DealerAdded(dealer);
    }

    function addInsuranceCompany(
        address insuranceCompany
    ) public onlyGovernment {
        require(
            !isInsuranceCompany[insuranceCompany],
            "Insurance company already added"
        );
        isInsuranceCompany[insuranceCompany] = true;
        emit InsuranceCompanyAdded(insuranceCompany);
    }

    function addTrafficPolice(address trafficPolice) public onlyGovernment {
        require(
            !isTrafficPolice[trafficPolice],
            "Traffic police already added"
        );
        isTrafficPolice[trafficPolice] = true;
        emit TrafficPoliceAdded(trafficPolice);
    }

    function addNewOwner(
        string memory vin,
        address newOwner
    ) public onlyTrafficPolice carExists(vin) {
        require(
            cars[vin].owners[cars[vin].owners.length - 1] != newOwner,
            "New owner must be different from the old one"
        );
        cars[vin].owners.push(newOwner);
        emit NewOwnerAdded(vin, cars[vin]);
    }

    function changePlate(
        string memory vin,
        string memory newPlateNumber
    ) public onlyTrafficPolice carExists(vin) {
        require(
            bytes(newPlateNumber).length > 0,
            "Plate number cannot be empty"
        );
        if (cars[vin].plateNumbers.length > 0) {
            require(
                keccak256(
                    abi.encodePacked(
                        cars[vin].plateNumbers[
                            cars[vin].plateNumbers.length - 1
                        ]
                    )
                ) != keccak256(abi.encodePacked(newPlateNumber)),
                "New plate number must be different from the old one"
            );
        }
        cars[vin].plateNumbers.push(newPlateNumber);
        emit PlateChanged(vin, cars[vin]);
    }

    function isCarStolen(
        string memory vin
    ) public view carExists(vin) returns (bool) {
        if (cars[vin].theftHistory.length == 0) {
            return false;
        }
        return
            cars[vin].theftHistory[cars[vin].theftHistory.length - 1].isStolen;
    }

    function reportThieftState(
        string memory vin,
        string memory location,
        bool isStolen
    ) public onlyTrafficPolice carExists(vin) {
        isStolen
            ? require(!isCarStolen(vin), "Car is already stolen")
            : require(isCarStolen(vin), "Car is already found");

        cars[vin].theftHistory.push(
            CarTypes.Theft(block.timestamp, isStolen, location)
        );

        if (isStolen) {
            emit CarReportedStolen(vin, cars[vin]);
        } else {
            emit CarReportedFound(vin, cars[vin]);
        }
    }

    function addFines(
        string memory vin,
        string[] memory descriptions,
        uint[] memory amounts
    ) public onlyTrafficPolice carExists(vin) {
        require(
            descriptions.length == amounts.length,
            "Descriptions and amounts must be the same length"
        );
        for (uint i = 0; i < descriptions.length; i++) {
            require(
                bytes(descriptions[i]).length > 0,
                "Description cannot be empty"
            );
            require(amounts[i] > 0, "Amount must be greater than 0");
            CarTypes.Fine memory fineToAdd = CarTypes.Fine(
                block.timestamp,
                descriptions[i],
                amounts[i],
                false
            );
            cars[vin].fines.push(fineToAdd);
        }
        emit FinesAdded(vin, cars[vin]);
    }

    function payFine(
        string memory vin,
        uint fineIndex
    ) public payable carExists(vin) {
        require(
            msg.value == cars[vin].fines[fineIndex].amount,
            "Not enough money to pay the fine"
        );
        require(
            fineIndex < cars[vin].fines.length,
            "Fine with this index does not exist"
        );
        require(!cars[vin].fines[fineIndex].paid, "Fine has already been paid");
        (bool sent, ) = state.call{value: msg.value}("");
        require(sent, "Unable to send value, transaction failed");
        cars[vin].fines[fineIndex].paid = true;
        emit FinePaid(vin, cars[vin]);
    }

    function markAsPaid(
        string memory vin,
        uint fineIndex
    ) public onlyTrafficPolice carExists(vin) {
        require(
            fineIndex < cars[vin].fines.length,
            "Fine with this index does not exist"
        );
        require(!cars[vin].fines[fineIndex].paid, "Fine has already been paid");
        cars[vin].fines[fineIndex].paid = true;
        emit FinePaid(vin, cars[vin]);
    }

    function addServiceHistory(
        string memory vin,
        uint mileage,
        string[] memory serviceWorks
    ) public onlyDealer carExists(vin) {
        require(
            cars[vin].mileage < mileage,
            "New mileage must be greater than old one"
        );
        cars[vin].mileage = mileage;
        CarTypes.ServiceWork memory serviceWorkToAdd = CarTypes.ServiceWork(
            block.timestamp,
            mileage,
            serviceWorks
        );
        cars[vin].serviceHistory.push(serviceWorkToAdd);
        emit ServiceHistoryUpdated(vin, cars[vin]);
    }

    function addAccident(
        string memory vin,
        string memory description,
        string[] memory images
    ) public onlyInsuranceCompany carExists(vin) {
        require(bytes(description).length > 0, "Description cannot be empty");
        require(images.length > 0, "Images cannot be empty");
        CarTypes.Accident memory accidentToAdd = CarTypes.Accident(
            block.timestamp,
            description,
            images
        );
        cars[vin].accidents.push(accidentToAdd);
        emit AccidentAdded(vin, cars[vin]);
    }

    function isCarExists(string memory vin) public view returns (bool) {
        require(bytes(vin).length > 0, "VIN cannot be empty");
        return cars[vin].owners.length > 0;
    }

    modifier carExists(string memory vin) {
        require(
            cars[vin].owners.length > 0,
            "Car with this VIN does not exist"
        );
        _;
    }

    function getCarInfo(
        string memory vin
    ) public view carExists(vin) returns (CarTypes.Car memory) {
        require(
            isDealer[msg.sender] ||
                isInsuranceCompany[msg.sender] ||
                isTrafficPolice[msg.sender],
            "Only dealer, insurance company or traffic police can call this function"
        );
        return cars[vin];
    }

    function buyReport(string memory vin) public payable carExists(vin) {
        require(msg.value == 0.01 ether, "Not enough money to buy report");
        (bool sent, ) = state.call{value: msg.value}("");
        require(sent, "Unable to send value, transaction failed");
        emit ReportPurchased(vin, cars[vin]);
    }

    function addCar(
        string memory vin,
        string memory brand,
        string memory model,
        uint year,
        string memory fuelType,
        string memory transmissionType,
        string memory color,
        string memory configuration,
        string memory country,
        address owner
    ) public onlyDealer {
        require(bytes(vin).length > 0, "VIN cannot be empty");
        require(bytes(brand).length > 0, "Brand cannot be empty");
        require(bytes(model).length > 0, "Model cannot be empty");
        require(year > 0, "Year must be greater than 0");
        require(bytes(fuelType).length > 0, "Fuel type cannot be empty");
        require(
            bytes(transmissionType).length > 0,
            "Transmission type cannot be empty"
        );
        require(bytes(color).length > 0, "Color cannot be empty");
        require(
            bytes(configuration).length > 0,
            "Configuration cannot be empty"
        );
        require(bytes(country).length > 0, "Country cannot be empty");
        require(owner != address(0), "Owner cannot be empty");
        require(!isCarExists(vin), "Car with this VIN already exists");

        CarTypes.Car storage car = cars[vin];
        car.brand = brand;
        car.model = model;
        car.year = year;
        car.fuelType = fuelType;
        car.transmissionType = transmissionType;
        car.color = color;
        car.configuration = configuration;
        car.country = country;
        car.owners.push(owner);

        emit CarAdded(vin, cars[vin]);
    }
}
