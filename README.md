### Vin Decode
**Description**
This application utilizes blockchain technology to manage and track vehicle information, service history, police reports, and insurance claims. It is built on the Ethereum blockchain using Solidity and provides distinct functionalities for car dealers, traffic police departments, and insurance companies.

**Live demo**

https://vin-decode-alchemy-21389b05723f.herokuapp.com/

**Getting Started**
**Prerequisites**

- MetaMask Browser Extension
- Connection to the Sepolia Testnet

**Installation and Setup**

1. Install MetaMask: Download and install the MetaMask browser extension from [MetaMask.io](https://metamask.io/).
2. Switch to Sepolia Testnet: In MetaMask, switch your network to the Sepolia Testnet.
3. Obtain Test Ether: Visit [Sepolia Faucet](https://sepoliafaucet.com/) to get some test Ether for transactions.

### Accessing the Admin Panel

To access advanced features, navigate to the admin panel. This panel grants superuser permissions for functionalities specific to official dealers, traffic police, and insurance companies.
**Functionality**

### Dealer's Role

Add a New Car: Enter the VIN number (17 characters, excluding I, O, Q), select car details from dropdown menus, and enter the owner's Ethereum address. Each car is represented by a unique VIN number to prevent duplicates.
Manage Service: Enter the car's mileage and select the services performed. Mileage input must be greater than the last recorded to avoid odometer tampering.

### Traffic Police Department

Vehicle Registration and Ownership Transfer: Change the car's plate number or owner.
Report Stolen or Found Vehicles: Update the car's status as stolen or found. When stolen, changes to plate and ownership are restricted.
Fines Management: Add and manage traffic fines. Fines can be marked as paid by the police if appealed successfully in court, otherwise, they must be paid by the owner.
### Insurance Company
Accident Reporting: Report accidents, add descriptions, and upload photos. Photos are uploaded to the IPFS network, and their hashes are stored on the blockchain.
### Full Report
On the home page, enter a VIN number to check its existence for free. Full reports can be purchased for 0.01 Sepolia ETH.

For example check this vin "AAAAAAAAAAAAAAAAA" (17 A's) to see all sections of report.
### Enjoy
Explore the various functionalities of the app as a dealer, traffic police, or insurance company representative.


https://github.com/refatsherfedinov/vin-decode/assets/103290225/7af691ee-162a-4229-a6e8-23e7e8e26b50

