import SearchBar from '../components/SearchBar/SearchBar';
import Header from '../components/Header/Header';
import styles from './HomePage.module.css';
import { useSmartContract } from '../components/ContractContext/ContractContext';
import { useState } from 'react';
import { set } from 'date-fns';
import {
    Button,
    Card,
    Chip,
    IconButton,
    ImageList,
    ImageListItem,
    List,
    ListItem,
    ListItemText,
    Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import DoDisturbOnIcon from '@mui/icons-material/DoDisturbOn';
import CarInfo from '../components/CarInfo/CarInfo';
import convertTimestamp from '../utils/convertTimestamp';
import ExpandImageDialog from '../components/ExpandImageDialog/ExpandImageDialog';
import TransactionProcessingDialog from '../components/TransactionProcessingDialog/TransactionProcessingDialog';
import ErrorMessageDialog from '../components/ErrorMessageDialog/ErrorMessageDialog';
import { ethers } from 'ethers';

const HomePage = () => {
    const contract = useSmartContract();
    const [vinCode, setVinCode] = useState<string | null>(null);
    const [carData, setCarData] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [carExists, setCarExists] = useState<boolean>(false);
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);

    const handlePayFine = async (index: number, amount: number) => {
        try {
            const tx = await contract?.payFine(vinCode, index, {
                value: amount,
            });
            setTxHash(tx.hash);
            setLoading(true);
            await tx.wait();
            setCarData((prev: any) => {
                if (prev) {
                    return {
                        ...prev,
                        fines: prev.fines.map((fine: any, i: number) => {
                            if (i === index) {
                                return {
                                    ...fine,
                                    paid: true,
                                };
                            }
                            return fine;
                        }),
                    };
                }
                return prev;
            });
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            console.error('Error:', error);
        }
    };

    const handleSearch = async () => {
        if (!vinCode) {
            return;
        }
        try {
            const carExists = await contract?.isCarExists(vinCode);
            setCarExists(carExists);
            if (!carExists) {
                setErrorMessage('Car does not exist in database');
                setIsErrorDialogOpen(true);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleBuyReport = async () => {
        try {
            const carInfo = await contract?.buyReport(vinCode, {
                value: ethers.utils.parseEther('0.01'),
            });

            setTxHash(carInfo.hash);

            setLoading(true);
            contract?.on('ReportPurchased', (vin, car) => {
                if (vin === vinCode) {
                    setCarData(car);
                    console.log(car);
                    contract?.removeAllListeners('ReportPurchased');
                }
            });

            await carInfo.wait();
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            console.error('Error:', error);
        }
    };

    return (
        <div>
            <Header />
            <div className={styles.container}>
                <div className={styles.description}>
                    <h1>Check car history by VIN code</h1>
                    <h3>
                        VinDecode has the most complete database of used cars.
                        We will show accidents, liens, repairs, mileage
                        adjustments, restrictions and much more.
                    </h3>
                    <SearchBar
                        vinCode={vinCode}
                        setVinCode={setVinCode}
                        handleSearch={handleSearch}
                    />
                    {carExists && (
                        <div className={styles.tips}>
                            <a>Car exists in database you can order report</a>
                        </div>
                    )}
                    <div className={styles.showReport}>
                        <Button
                            variant='contained'
                            onClick={handleBuyReport}
                            disabled={!carExists}
                        >
                            Buy report
                        </Button>
                    </div>
                    {carData && (
                        <div className={styles.carReport}>
                            <h2>Car report</h2>
                            <CarInfo carData={carData} />
                            <List style={{ width: 500 }}>
                                {carData.serviceHistory.length > 0 ? (
                                    <div>
                                        <h2>Service history</h2>
                                        <List className={styles.serviceHistory}>
                                            {carData.serviceHistory.map(
                                                (service: any) => (
                                                    <Card
                                                        key={service.date}
                                                        className={
                                                            styles.service
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.serviceDate
                                                            }
                                                        >
                                                            {convertTimestamp(
                                                                service.date
                                                            )}
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
                                                            <List
                                                                sx={{
                                                                    padding: 0,
                                                                }}
                                                            >
                                                                {service.works.map(
                                                                    (
                                                                        work: string
                                                                    ) => (
                                                                        <Chip
                                                                            label={
                                                                                work
                                                                            }
                                                                        />
                                                                    )
                                                                )}
                                                            </List>
                                                        </div>
                                                    </Card>
                                                )
                                            )}
                                        </List>
                                    </div>
                                ) : (
                                    <ListItem divider>
                                        <ListItemText
                                            primary={`No service history`}
                                        />{' '}
                                    </ListItem>
                                )}

                                {carData.owners.length > 0 ? (
                                    <div>
                                        <h2>Owners history</h2>

                                        <List sx={{ width: 500 }}>
                                            {carData.owners.map(
                                                (
                                                    owner: string,
                                                    index: number
                                                ) => (
                                                    <Card key={index}>
                                                        <ListItem divider>
                                                            <ListItemText
                                                                primary={`${owner}`}
                                                            />
                                                        </ListItem>
                                                    </Card>
                                                )
                                            )}
                                        </List>
                                    </div>
                                ) : (
                                    <ListItem divider>
                                        <ListItemText
                                            primary={`No owners history`}
                                        />{' '}
                                    </ListItem>
                                )}

                                {carData.fines.length > 0 ? (
                                    <div>
                                        <h2>Fines history</h2>
                                        <List sx={{ width: 500 }}>
                                            {carData.fines.map(
                                                (fine: any, index: number) => (
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
                                                                    handlePayFine(
                                                                        index,
                                                                        fine.amount
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
                                                )
                                            )}
                                        </List>
                                    </div>
                                ) : (
                                    <ListItem divider>
                                        <ListItemText
                                            primary={`No fines history`}
                                        />{' '}
                                    </ListItem>
                                )}

                                {carData.theftHistory?.length > 0 ? (
                                    <div>
                                        <h2>Theft history</h2>
                                        <List sx={{ width: 500 }}>
                                            {carData.theftHistory?.map(
                                                (theft: any) => (
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
                                                )
                                            )}
                                        </List>
                                    </div>
                                ) : (
                                    <ListItem divider>
                                        <ListItemText
                                            primary={`No thefts history`}
                                        />
                                    </ListItem>
                                )}

                                {carData.accidents.length > 0 ? (
                                    <div>
                                        <h2>Accidents history</h2>
                                        <List
                                            sx={{ padding: 0, maxWidth: 500 }}
                                        >
                                            {carData.accidents.map(
                                                (
                                                    accident: any,
                                                    index: number
                                                ) => (
                                                    <Card
                                                        key={index}
                                                        className={
                                                            styles.service
                                                        }
                                                    >
                                                        <ListItem divider>
                                                            <ListItemText
                                                                style={{
                                                                    wordWrap:
                                                                        'break-word',
                                                                }}
                                                                primary={`${convertTimestamp(
                                                                    carData
                                                                        .accidents[
                                                                        index
                                                                    ].date
                                                                )} ${
                                                                    accident.description
                                                                }`}
                                                            />
                                                        </ListItem>

                                                        <ListItem>
                                                            {accident.images
                                                                .length > 0 && (
                                                                <ImageList
                                                                    sx={{
                                                                        width: 500,
                                                                        maxHeight: 250,
                                                                        position:
                                                                            'relative',
                                                                        overflow:
                                                                            'auto',
                                                                        '& ul': {
                                                                            padding: 0,
                                                                        },
                                                                    }}
                                                                    cols={4}
                                                                    rowHeight={
                                                                        100
                                                                    }
                                                                >
                                                                    {accident.images.map(
                                                                        (
                                                                            accidentImg: string,
                                                                            imgIndex: number
                                                                        ) => (
                                                                            <ImageListItem
                                                                                key={`${index}-${imgIndex}`}
                                                                            >
                                                                                <img
                                                                                    src={
                                                                                        accidentImg
                                                                                    }
                                                                                    style={{
                                                                                        backgroundColor:
                                                                                            'white',
                                                                                        width: 100,
                                                                                        height: 100,
                                                                                        cursor: 'pointer',
                                                                                        borderRadius: 10,
                                                                                    }}
                                                                                    alt={`Preview ${
                                                                                        index +
                                                                                        1
                                                                                    }`}
                                                                                    onClick={() =>
                                                                                        setSelectedImage(
                                                                                            accidentImg
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </ImageListItem>
                                                                        )
                                                                    )}
                                                                </ImageList>
                                                            )}
                                                        </ListItem>
                                                    </Card>
                                                )
                                            )}
                                        </List>
                                    </div>
                                ) : (
                                    <ListItem divider>
                                        <ListItemText
                                            primary={`No accidents history`}
                                        />{' '}
                                    </ListItem>
                                )}
                            </List>
                        </div>
                    )}
                </div>
            </div>
            <ExpandImageDialog
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
            />
            <TransactionProcessingDialog loading={loading} txHash={txHash} />
            <ErrorMessageDialog
                errorMessage={errorMessage}
                open={isErrorDialogOpen}
                onClose={() => setIsErrorDialogOpen(false)}
            />
        </div>
    );
};

export default HomePage;
