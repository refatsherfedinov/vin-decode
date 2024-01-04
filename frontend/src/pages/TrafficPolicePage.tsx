import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header/Header';
import {
    Autocomplete,
    Button,
    Card,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Stack,
    TextField,
} from '@mui/material';
import styles from './TrafficPolicePage.module.css';
import ErrorMessageDialog from '../components/ErrorMessageDialog/ErrorMessageDialog';
import useAllowedUserAddress from '../utils/checkIsAddressAllowed';
import TransactionProcessingDialog from '../components/TransactionProcessingDialog/TransactionProcessingDialog';
import convertTimestamp from '../utils/convertTimestamp';
import finesList from '../fines.json';
import CheckIcon from '@mui/icons-material/Check';
import DoDisturbOnIcon from '@mui/icons-material/DoDisturbOn';
import SearchBar from '../components/SearchBar/SearchBar';
import {
    useSmartContract,
    useUserAddress,
} from '../components/ContractContext/ContractContext';
import CarInfo from '../components/CarInfo/CarInfo';
import { ethers } from 'ethers';
type Theft = {
    date: number;
    isStolen: boolean;
    location: string;
};

type Fine = {
    date: number;
    description: string;
    amount: number;
    paid: boolean;
};

type Car = {
    brand: string;
    model: string;
    year: number;
    fuelType: string;
    transmissionType: string;
    color: string;
    configuration: string;
    country: string;
    plateNumbers: string[];
    mileage: number;
    owners: string[];
    fines: Fine[];
    theftHistory: Theft[];
};

const TrafficPolicePage = () => {
    const [carStolen, setCarStolen] = useState<boolean>(false);
    const [vinCode, setVinCode] = useState<string | null>(null);
    const [isOwnerValid, setIsOwnerValid] = useState(true);
    const [isVinValid, setIsVinValid] = useState(true);
    const [newOwnerAddress, setNewOwnerAddress] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [cursor, setCursor] = useState<number | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [plateNumber, setPlateNumber] = useState<string | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedFines, setSelectedFines] = useState<
        { law: string; fineAmount: number }[]
    >([]);
    const [carData, setCarData] = useState<Car | null>(null);
    const [parkingLocation, setParkingLocation] = useState<string>('');
    const contract = useSmartContract();
    const userAddress = useUserAddress();

    const checkIsAddressAllowed = useAllowedUserAddress();
    useEffect(() => {
        const init = async () => {
            const result = await checkIsAddressAllowed(contract, userAddress);
            setIsAuthorized(result);
        };
        init();
    }, [userAddress]);

    useEffect(() => {
        if (!userAddress) {
            setErrorMessage('Please connect your wallet');
        }

        if (!isAuthorized) {
            setErrorMessage('You are not authorized to access this page');
        }
        setIsErrorDialogOpen(!isAuthorized || !userAddress);
    }, [userAddress, isAuthorized]);

    const validateOwnerAddress = (value: string) => {
        const ownerAddressRegex =
            /^0x[a-fA-F0-9]{40}$/; /* Regex for Ethereum addresses */
        return ownerAddressRegex.test(value) || value === '';
    };

    const handleOwnerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsOwnerValid(validateOwnerAddress(event.target.value));
        setNewOwnerAddress(event.target.value);
    };

    const eventHandler = (eventName: string) => {
        contract?.on(eventName, (vin, car) => {
            if (vin === vinCode) {
                setCarData(car);
                contract?.removeAllListeners(eventName);
            }
        });
    };

    useEffect(() => {
        if (inputRef.current && cursor !== null) {
            inputRef.current.setSelectionRange(cursor, cursor);
        }
    }, [vinCode, cursor]);

    const handleThieftReport = async () => {
        try {
            const tx = await contract?.reportThieftState(
                vinCode,
                parkingLocation,
                !carStolen
            );

            setTxHash(tx.hash);
            setLoading(true);
            const theftStatus = !carStolen;
            eventHandler(
                theftStatus ? 'CarReportedStolen' : 'CarReportedFound'
            );
            await tx.wait();
            setCarStolen(!carStolen);
            setParkingLocation('');
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            console.error('Error:', error);
        }
    };

    const handleParkingLocationChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setParkingLocation(event.target.value);
    };

    const handleSearchButton = async () => {
        try {
            const carInfo = await contract?.getCarInfo(vinCode);
            console.log(carInfo);
            if (carInfo.brand) {
                setCarData(carInfo);
                setCarStolen(
                    carInfo.theftHistory.length > 0
                        ? carInfo.theftHistory[carInfo.theftHistory.length - 1]
                              .isStolen
                        : false
                );
            }
        } catch (error: any) {
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            console.error('Error:', error);
        }
    };

    const handlePlateChange = async () => {
        try {
            if (vinCode && plateNumber) {
                const tx = await contract?.changePlate(vinCode, plateNumber);
                setTxHash(tx.hash);
                setLoading(true);
                eventHandler('PlateChanged');
                await tx.wait();
                setPlateNumber('');
                setLoading(false);
            }
        } catch (error: any) {
            setLoading(false);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            console.error('Error:', error);
        }
    };

    const handleAddNewOwner = async () => {
        try {
            if (isOwnerValid && newOwnerAddress) {
                const tx = await contract?.addNewOwner(
                    vinCode,
                    newOwnerAddress
                );
                setTxHash(tx.hash);
                setLoading(true);
                eventHandler('NewOwnerAdded');
                await tx.wait();
                setLoading(false);
                setNewOwnerAddress('');
            }
        } catch (error: any) {
            setLoading(false);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            console.error('Error:', error);
        }
    };

    const handleAddFines = async () => {
        try {
            if (selectedFines.length) {
                const tx = await contract?.addFines(
                    vinCode,
                    selectedFines.map((fine) => fine.law),
                    selectedFines.map((fine) =>
                        ethers.utils.parseEther(fine.fineAmount.toString())
                    )
                );
                setTxHash(tx.hash);
                setLoading(true);
                eventHandler('FinesAdded');
                await tx.wait();
                setLoading(false);
                setSelectedFines([]);
            }
        } catch (error: any) {
            setLoading(false);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            console.error('Error:', error);
        }
    };
    const handleMarkAsPaid = async (index: number) => {
        try {
            const tx = await contract?.markAsPaid(vinCode, index);
            setTxHash(tx.hash);
            setLoading(true);
            eventHandler('FinePaid');
            await tx.wait();
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            console.error('Error:', error);
        }
    };

    if (!userAddress) {
        return <div>Loading or not connected...</div>;
    }

    if (!isAuthorized) {
        return (
            <div>You are not authorized to access this page {userAddress}.</div>
        );
    }

    return (
        <div>
            <Header />

            <div className={styles.container}>
                <h1>Traffic Police Management</h1>
                <SearchBar
                    vinCode={vinCode}
                    setVinCode={setVinCode}
                    handleSearch={handleSearchButton}
                />

                {carData && (
                    <div className={styles.dashboard}>
                        <div>
                            <h2>Car Info</h2>
                            <CarInfo carData={carData} />
                        </div>

                        <div className={styles.controls}>
                            <h2>Plate registration</h2>
                            <div className={styles.plate}>
                                <div className={styles.plateNumber}>
                                    <TextField
                                        placeholder='Enter New Plate Number'
                                        InputProps={{
                                            sx: {
                                                borderTopRightRadius: 0,
                                                borderBottomRightRadius: 0,
                                            },
                                        }}
                                        // sx={{ width: 200 }}
                                        disabled={carStolen}
                                        value={plateNumber}
                                        onChange={(e) => {
                                            setPlateNumber(
                                                e.target.value.toLocaleUpperCase()
                                            );
                                        }}
                                    />

                                    <Button
                                        variant='contained'
                                        disabled={carStolen}
                                        sx={{
                                            width: 200,
                                            height: 56,
                                            borderTopLeftRadius: 0,
                                            borderBottomLeftRadius: 0,
                                        }}
                                        onClick={handlePlateChange}
                                    >
                                        Change
                                    </Button>
                                </div>
                            </div>
                            <div className={styles.addNewOwner}>
                                <h2>Change of owner</h2>
                                <TextField
                                    placeholder='Enter New Owner'
                                    value={newOwnerAddress}
                                    onChange={handleOwnerChange}
                                    InputProps={{
                                        sx: {
                                            borderBottomLeftRadius: 0,
                                            borderBottomRightRadius: 0,
                                        },
                                    }}
                                    sx={{ width: 400 }}
                                    error={!isOwnerValid}
                                />
                                <Button
                                    variant='contained'
                                    sx={{
                                        width: 400,
                                        height: 56,
                                        borderTopLeftRadius: 0,
                                        borderTopRightRadius: 0,
                                    }}
                                    onClick={handleAddNewOwner}
                                    disabled={!isOwnerValid || !newOwnerAddress}
                                >
                                    {carStolen
                                        ? 'UNABLE WHILE CAR IS STOLEN'
                                        : 'Add New Owner'}
                                </Button>
                            </div>

                            <div className={styles.theftControl}>
                                <h2>Theft control</h2>
                                <TextField
                                    placeholder='Parking Location'
                                    value={parkingLocation}
                                    onChange={handleParkingLocationChange}
                                    InputProps={{
                                        sx: {
                                            borderBottomLeftRadius: 0,
                                            borderBottomRightRadius: 0,
                                        },
                                    }}
                                    sx={{ width: 400 }}
                                    error={!isOwnerValid}
                                />

                                <Button
                                    color={carStolen ? 'success' : 'error'}
                                    variant='contained'
                                    sx={{
                                        width: 400,
                                        height: 56,
                                        borderTopLeftRadius: 0,
                                        borderTopRightRadius: 0,
                                    }}
                                    onClick={handleThieftReport}
                                >
                                    {carStolen
                                        ? 'Report Found'
                                        : 'Report Stolen'}
                                </Button>
                            </div>
                            <div className={styles.theftsHistory}>
                                <h3>Thefts History</h3>
                                <Divider />
                                {carData.theftHistory?.length > 0 ? (
                                    <List sx={{ width: 400 }}>
                                        {carData.theftHistory?.map((theft) => (
                                            <Card key={theft.date}>
                                                <ListItem divider>
                                                    <ListItemText
                                                        primary={`${convertTimestamp(
                                                            theft.date
                                                        )}
                                                        Car was ${
                                                            theft.isStolen
                                                                ? 'stolen'
                                                                : 'found'
                                                        } at ${theft.location}`}
                                                    />
                                                </ListItem>
                                            </Card>
                                        ))}
                                    </List>
                                ) : (
                                    <ListItem divider>
                                        <ListItemText
                                            primary={`No thefts history`}
                                        />
                                    </ListItem>
                                )}
                            </div>
                        </div>
                        <div className={styles.fines}>
                            <h2>Fines</h2>
                            <div className={styles.addFines}>
                                <Stack spacing={3} sx={{ width: 400 }}>
                                    <Autocomplete
                                        multiple
                                        id='tags-outlined'
                                        options={finesList}
                                        value={selectedFines}
                                        getOptionLabel={(option) =>
                                            `${option.law} - ${option.fineAmount} SepETH`
                                        }
                                        onChange={(event, newValue) => {
                                            setSelectedFines(newValue);
                                        }}
                                        renderOption={(props, option) => (
                                            <li {...props}>
                                                {option.law} {option.fineAmount}
                                            </li>
                                        )}
                                        filterSelectedOptions
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder='Fines'
                                            />
                                        )}
                                    />
                                </Stack>
                                <Button
                                    variant='contained'
                                    sx={{
                                        width: 400,
                                        height: 56,
                                    }}
                                    onClick={handleAddFines}
                                >
                                    Add Fine
                                </Button>
                            </div>
                            <div className={styles.finesHistory}>
                                <h3>Fines History</h3>
                                <Divider />
                                {carData.fines.length > 0 ? (
                                    <List sx={{ width: 400 }}>
                                        {carData.fines.map((fine, index) => (
                                            <Card key={fine.date}>
                                                <ListItem
                                                    divider
                                                    key={fine.date}
                                                >
                                                    <ListItemText
                                                        primary={`${convertTimestamp(
                                                            fine.date
                                                        )}: ${
                                                            fine.description
                                                        } - ${ethers.utils.formatEther(
                                                            fine.amount
                                                        )} SepETH`}
                                                    />
                                                    <IconButton
                                                        onClick={() =>
                                                            handleMarkAsPaid(
                                                                index
                                                            )
                                                        }
                                                        onMouseEnter={() =>
                                                            setHoveredIndex(
                                                                index
                                                            )
                                                        }
                                                        onMouseLeave={() =>
                                                            setHoveredIndex(
                                                                null
                                                            )
                                                        }
                                                        sx={{
                                                            color:
                                                                fine.paid ||
                                                                hoveredIndex ===
                                                                    index
                                                                    ? 'green'
                                                                    : 'red',
                                                        }}
                                                    >
                                                        {fine.paid ||
                                                        hoveredIndex ===
                                                            index ? (
                                                            <CheckIcon />
                                                        ) : (
                                                            <DoDisturbOnIcon />
                                                        )}
                                                    </IconButton>
                                                </ListItem>
                                            </Card>
                                        ))}
                                    </List>
                                ) : (
                                    <ListItem divider>
                                        <ListItemText
                                            primary={`No fines history`}
                                        />{' '}
                                    </ListItem>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ErrorMessageDialog
                errorMessage={errorMessage}
                open={isErrorDialogOpen}
                onClose={() => setIsErrorDialogOpen(false)}
            />
            <TransactionProcessingDialog loading={loading} txHash={txHash} />
        </div>
    );
};

export default TrafficPolicePage;
