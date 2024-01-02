import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header/Header';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import cars from '../car-list.json';
import carColorsJson from '../car-colors.json';
import styles from './DealerPage.module.css';
import serviceList from '../service-list.json';
import configurationsList from '../car-configurations.json';
import emojiFlags from 'emoji-flags';
import {
    Box,
    Button,
    Card,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import ErrorMessageDialog from '../components/ErrorMessageDialog/ErrorMessageDialog';
import useAllowedUserAddress from '../utils/checkIsAddressAllowed';
import TransactionProcessingDialog from '../components/TransactionProcessingDialog/TransactionProcessingDialog';
import {
    useSmartContract,
    useUserAddress,
} from '../components/ContractContext/ContractContext';
import SearchBar from '../components/SearchBar/SearchBar';
import { format } from 'date-fns';
import CarInfo, { Car } from '../components/CarInfo/CarInfo';
import convertTimestamp from '../utils/convertTimestamp';

type Color = {
    name: string;
    value: string | undefined;
};
type ServiceWork = {
    date: number;
    mileage: number;
    works: string[];
};
type CountryData = {
    code: string;
    emoji: string;
    name: string;
    title: string;
    unicode: string;
};

const DealerPage = () => {
    const [vinCode, setVinCode] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [year, setYear] = useState<number | null>(null);
    const [ownerAddress, setOwnerAddress] = useState<string>('');
    const [isValid, setIsValid] = useState<boolean>(true);
    const [carExists, setCarExists] = useState<boolean>(false);
    const [isVinValid, setIsVinValid] = useState<boolean>(false);
    const [mileage, setMileage] = useState<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const [cursor, setCursor] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [transmissionType, setTransminssionType] = useState<string | null>(
        null
    );
    const [fuelType, setFuelType] = useState<string | null>(null);
    const [color, setColor] = useState<Color | null>(null);
    const [selectedServices, setSelectedServises] = useState<string[]>([]);
    const [serviceHistory, setServiceHistory] = useState<ServiceWork[]>([]);

    const [brandNames, setBrandNames] = useState<string[]>(
        cars.map((car) => car.brand)
    );
    const [modelsList, setModelsList] = useState<string[]>([]);
    const [configurations, setConfigurations] = useState(configurationsList);
    const [selectedConfiguration, setSelectedConfiguration] = useState<
        string | null
    >(null);
    const [countryOfOrigin, setCountryOfOrigin] = useState<CountryData | null>(
        null
    );
    const [carInfo, setCarInfo] = useState<Car | null>(null);

    const contract = useSmartContract();
    const userAddress = useUserAddress();
    const checkIsAddressAllowed = useAllowedUserAddress();

    useEffect(() => {
        const init = async () => {
            const result = await checkIsAddressAllowed(contract, userAddress);
            console.log(result);
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

    const colors = carColorsJson.map((color) => ({
        name: color.name,
        value: color.value,
    }));

    useEffect(() => {
        if (selectedBrand) {
            setModelsList(
                cars
                    .filter((car) => car.brand === selectedBrand)
                    .flatMap((car) => car.models)
            );
        }
    }, [selectedBrand]);
    const validateOwnerAddress = (value: string) => {
        const ownerAddressRegex =
            /^0x[a-fA-F0-9]{40}$/; /* Regex for Ethereum addresses */
        return ownerAddressRegex.test(value);
    };

    const handleBrandChange = (
        event: React.SyntheticEvent,
        newValue: string | null
    ) => {
        setSelectedModel(null);
        setSelectedBrand(newValue);
    };

    const handleModelChange = (
        event: React.SyntheticEvent,
        newValue: string | null
    ) => {
        setSelectedModel(newValue);
    };

    const handleYearChange = (
        event: React.SyntheticEvent,
        newValue: number | null
    ) => {
        setYear(newValue);
    };
    const handleTransminssionTypeChange = (
        event: React.SyntheticEvent,
        newValue: string | null
    ) => {
        setTransminssionType(newValue);
    };
    const handleFuelTypeChange = (
        event: React.SyntheticEvent,
        newValue: string | null
    ) => {
        setFuelType(newValue);
    };

    const handleColorChange = (event: React.SyntheticEvent, newValue: any) => {
        setColor(newValue);
    };
    const handleOwnerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsValid(validateOwnerAddress(event.target.value));
        setOwnerAddress(event.target.value);
    };
    const validateVin = (value: string) => {
        const vinCodeRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
        return vinCodeRegex.test(value) || value === '';
    };
    const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cursorPosition = e.target.selectionStart;
        setCursor(cursorPosition);

        const value = e.target.value.toUpperCase();
        setVinCode(value);
        setIsVinValid(validateVin(value));
        setCarExists(false);
    };

    useEffect(() => {
        if (inputRef.current && cursor !== null) {
            inputRef.current.setSelectionRange(cursor, cursor);
        }
    }, [vinCode, cursor]);

    const handleMileageChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const newValue: number = parseInt(event.target.value);
        setMileage(newValue);
    };

    const addService = async () => {
        try {
            const tx = await contract?.addServiceHistory(
                vinCode,
                mileage,
                selectedServices
            );
            setLoading(true);
            setTxHash(tx.hash);
            await tx.wait();
            setLoading(false);

            setServiceHistory((prev) => [
                ...prev,
                {
                    date: Date.now() / 1000,
                    mileage: mileage,
                    works: selectedServices,
                },
            ]);
            setSelectedServises([]);
            setMileage(0);
        } catch (error: any) {
            console.error('Error:', error);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            setLoading(false);
        }
    };

    const handleSearchButton = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        if (!vinCode) {
            return;
        }

        const getCarInfo = async () => {
            try {
                const carInfo = await contract?.getCarInfo(vinCode);

                console.log(carInfo);
                if (carInfo.brand) {
                    setCarInfo(carInfo);

                    setCarExists(true);
                    setSelectedBrand(carInfo.brand);
                    setSelectedModel(carInfo.model);
                    setYear(carInfo.year);
                    setFuelType(carInfo.fuelType);
                    setTransminssionType(carInfo.transmissionType);
                    setColor(
                        carColorsJson.find((c) => c.name === carInfo.color)!
                    );
                    setSelectedConfiguration(carInfo.configuration);
                    setCountryOfOrigin(
                        emojiFlags.data.find(
                            (country) => country.name === carInfo.country
                        )!
                    );
                    setOwnerAddress(carInfo.owners[carInfo.owners.length - 1]);
                    setMileage(carInfo.mileage);

                    setServiceHistory(carInfo.serviceHistory);
                }
            } catch (error: any) {
                setCarInfo(null);

                setCarExists(false);
                setCarExists(false);
                setServiceHistory([]);
                setSelectedBrand(null);
                setSelectedModel(null);
                setYear(null);
                setFuelType(null);
                setTransminssionType(null);
                setColor(null);
                setSelectedConfiguration(null);
                setCountryOfOrigin(null);
                setOwnerAddress('');
                setMileage(0);
                setSelectedServises([]);
                setErrorMessage(JSON.stringify(error.reason));
                setIsErrorDialogOpen(true);
                console.error('Error:', error);
            }
        };
        getCarInfo();
    };

    const addCar = async () => {
        try {
            const tx = await contract?.addCar(
                vinCode,
                selectedBrand,
                selectedModel,
                year,
                fuelType,
                transmissionType,
                color?.name,
                selectedConfiguration,
                countryOfOrigin?.name,
                ownerAddress
            );
            setLoading(true);
            setTxHash(tx.hash);
            await tx.wait();
            setLoading(false);
        } catch (error: any) {
            console.error('Error:', error);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            setLoading(false);
        }
    };

    return (
        <div>
            <Header />

            <div className={styles.container}>
                <h1>Dealer's dashboard</h1>
                <SearchBar
                    vinCode={vinCode}
                    setVinCode={setVinCode}
                    handleSearch={handleSearchButton}
                />

                {carInfo && (
                    <div className={styles.dashboard}>
                        <div>
                            <h2>Car Info</h2>
                            <CarInfo carData={carInfo} />
                        </div>
                        <div className={styles.services}>
                            <h2>Service</h2>
                            <div className={styles.updateServiceForm}>
                                <TextField
                                    type='number'
                                    placeholder='Mileage'
                                    label='Mileage'
                                    onChange={handleMileageChange}
                                    value={mileage.toString()}
                                />
                                <Stack spacing={3}>
                                    <Autocomplete
                                        multiple
                                        id='tags-outlined'
                                        options={serviceList}
                                        value={selectedServices}
                                        onChange={(event, newValue) => {
                                            setSelectedServises(newValue);
                                        }}
                                        filterSelectedOptions
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder='Service'
                                                label='Service'
                                            />
                                        )}
                                    />
                                </Stack>
                                <Button
                                    variant='contained'
                                    onClick={addService}
                                    disabled={
                                        !vinCode ||
                                        !mileage ||
                                        !selectedServices
                                    }
                                >
                                    Add service
                                </Button>
                            </div>
                            <h3>Service History</h3>
                            <Divider />
                            {serviceHistory.length > 0 ? (
                                <List className={styles.serviceHistory}>
                                    {serviceHistory.map((service) => (
                                        <Card
                                            key={service.date}
                                            className={styles.service}
                                        >
                                            <div className={styles.serviceDate}>
                                                {convertTimestamp(service.date)}
                                            </div>
                                            <div
                                                className={
                                                    styles.serviceMileage
                                                }
                                            >
                                                <Typography
                                                    variant='subtitle2'
                                                    color='text.secondary'
                                                >
                                                    {service.mileage.toString()}{' '}
                                                    miles
                                                </Typography>
                                            </div>
                                            <div
                                                className={
                                                    styles.serviceWorksList
                                                }
                                            >
                                                <List sx={{ padding: 0 }}>
                                                    {service.works.map(
                                                        (work) => (
                                                            <Chip
                                                                label={work}
                                                            />
                                                        )
                                                    )}
                                                </List>
                                            </div>
                                        </Card>
                                    ))}
                                </List>
                            ) : (
                                <ListItem divider>
                                    <ListItemText
                                        primary={`No service history`}
                                    />{' '}
                                </ListItem>
                            )}
                        </div>
                    </div>
                )}
                {!carExists && (
                    <div className={styles.addNewCar}>
                        <h2>Add car</h2>
                        <div className={styles.addNewCarForm}>
                            <div className={styles.selectors}>
                                <div className={styles.leftCol}>
                                    <Autocomplete
                                        className={styles.carBrand}
                                        disablePortal
                                        id='brand-autocomplete'
                                        options={brandNames}
                                        value={selectedBrand}
                                        onChange={handleBrandChange}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder='Car Brand'
                                                label='Car Brand'
                                            />
                                        )}
                                    />
                                    <Autocomplete
                                        className={styles.carModel}
                                        disablePortal
                                        options={modelsList}
                                        value={selectedModel}
                                        onChange={handleModelChange}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder='Car Model'
                                                label='Car Model'
                                            />
                                        )}
                                        disabled={!selectedBrand}
                                    />
                                    <Autocomplete
                                        className={styles.carYear}
                                        disablePortal
                                        getOptionLabel={(option) =>
                                            option.toString()
                                        }
                                        id='year-autocomplete'
                                        options={Array.from(
                                            { length: 2023 - 1980 + 1 },
                                            (_, index) => 1980 + index
                                        )}
                                        value={year}
                                        onChange={handleYearChange}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder='Car Year'
                                                label='Car Year'
                                            />
                                        )}
                                    />

                                    <Autocomplete
                                        options={configurations}
                                        getOptionLabel={(option) => option.name}
                                        value={
                                            configurations.find(
                                                (option) =>
                                                    option.name ===
                                                    selectedConfiguration
                                            ) || null
                                        }
                                        onChange={(event, newValue) => {
                                            setSelectedConfiguration(
                                                newValue ? newValue.name : ''
                                            );
                                        }}
                                        renderOption={(props, option) => (
                                            <Tooltip
                                                title={option.description}
                                                placement='right'
                                                sx={{
                                                    maxWidth: 300,
                                                }}
                                            >
                                                <li {...props}>
                                                    {option.name}
                                                </li>
                                            </Tooltip>
                                        )}
                                        renderInput={(params) => (
                                            <TextField
                                                value={selectedConfiguration}
                                                {...params}
                                                placeholder='Choose a configuration'
                                                label='Configuration'
                                                variant='outlined'
                                            />
                                        )}
                                    />
                                </div>
                                <div className={styles.rightCol}>
                                    <Autocomplete
                                        className={styles.carTransmission}
                                        disablePortal
                                        id='transmission-autocomplete'
                                        options={['Automatic', 'Manual']}
                                        value={transmissionType}
                                        onChange={handleTransminssionTypeChange}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder='Transmission'
                                                label='Transmission'
                                            />
                                        )}
                                    />

                                    <Autocomplete
                                        className={styles.carFuelType}
                                        disablePortal
                                        id='fuel-autocomplete'
                                        options={[
                                            'Petrol',
                                            'Diesel',
                                            'Electric',
                                            'Hybrid',
                                            'LPG',
                                            'CNG',
                                            'Ethanol',
                                        ]}
                                        value={fuelType}
                                        onChange={handleFuelTypeChange}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder='Fuel Type'
                                                label='Fuel Type'
                                            />
                                        )}
                                    />
                                    <Autocomplete
                                        options={colors}
                                        getOptionLabel={(option) => option.name}
                                        renderOption={(props, option) => (
                                            <li
                                                {...props}
                                                style={{
                                                    backgroundColor:
                                                        option.value,
                                                }}
                                            >
                                                {option.name}
                                            </li>
                                        )}
                                        value={color}
                                        onChange={handleColorChange}
                                        isOptionEqualToValue={(option, value) =>
                                            option.value === value.value
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder='Choose a color'
                                                label='Color'
                                                variant='outlined'
                                                sx={{
                                                    backgroundColor:
                                                        color?.value,
                                                }}
                                            />
                                        )}
                                    />
                                    <Autocomplete
                                        options={emojiFlags.data}
                                        getOptionLabel={(option) => option.name}
                                        value={countryOfOrigin}
                                        onChange={(event, newValue) => {
                                            setCountryOfOrigin(newValue);
                                        }}
                                        renderOption={(props, option) => (
                                            <li {...props}>
                                                {option.emoji} {option.name}
                                            </li>
                                        )}
                                        isOptionEqualToValue={(option, value) =>
                                            option === value
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                value={countryOfOrigin}
                                                {...params}
                                                placeholder='Country of Origin'
                                                label='Country of Origin'
                                                variant='outlined'
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                            <TextField
                                className={styles.ownerAddress}
                                placeholder='Owner Address'
                                label='Owner Address'
                                onChange={handleOwnerChange}
                                error={!isValid}
                                value={ownerAddress}
                            />
                            <Button
                                variant='contained'
                                size='large'
                                onClick={addCar}
                                disabled={
                                    !selectedBrand ||
                                    !selectedModel ||
                                    !year ||
                                    !selectedConfiguration ||
                                    !fuelType ||
                                    !transmissionType ||
                                    !color ||
                                    !countryOfOrigin ||
                                    !ownerAddress ||
                                    // !isVinValid ||
                                    !isValid ||
                                    !vinCode ||
                                    carExists
                                }
                            >
                                Add car
                            </Button>
                        </div>
                    </div>
                )}
                <TransactionProcessingDialog
                    loading={loading}
                    txHash={txHash}
                />
                <ErrorMessageDialog
                    errorMessage={errorMessage}
                    open={isErrorDialogOpen}
                    onClose={() => setIsErrorDialogOpen(false)}
                />
            </div>
        </div>
    );
};

export default DealerPage;
