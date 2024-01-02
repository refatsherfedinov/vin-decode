// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CarTypes {
    struct Fine {
        uint date;
        string description;
        uint amount;
        bool paid;
    }

    struct Accident {
        uint date;
        string description;
        string[] images;
    }

    struct ServiceWork {
        uint date;
        uint mileage;
        string[] works;
    }

    struct Theft {
        uint date;
        bool isStolen;
        string location;
    }
    struct Car {
        string brand;
        string model;
        uint year;
        string fuelType;
        string transmissionType;
        string color;
        string configuration;
        string country;
        string[] plateNumbers;
        uint mileage;
        address[] owners;
        Fine[] fines;
        ServiceWork[] serviceHistory;
        Accident[] accidents;
        Theft[] theftHistory;
    }
}
