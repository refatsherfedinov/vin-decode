import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from '../components/Header/Header';
import styles from './InsuranceCompanyPage.module.css';
import {
    Box,
    Button,
    Card,
    Divider,
    ImageList,
    ImageListItem,
    List,
    ListItem,
    ListItemText,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import ErrorMessageDialog from '../components/ErrorMessageDialog/ErrorMessageDialog';
import useAllowedUserAddress from '../utils/checkIsAddressAllowed';
import TransactionProcessingDialog from '../components/TransactionProcessingDialog/TransactionProcessingDialog';
import ExpandImageDialog from '../components/ExpandImageDialog/ExpandImageDialog';
import SearchBar from '../components/SearchBar/SearchBar';
import {
    useSmartContract,
    useUserAddress,
} from '../components/ContractContext/ContractContext';
import convertTimestamp from '../utils/convertTimestamp';
import CarInfo from '../components/CarInfo/CarInfo';

type Accident = {
    date: number;
    description: string;
    images: string[];
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
    accidents: Accident[];
};

const carInfoKeys: (keyof Car)[] = [
    'brand',
    'model',
    'year',
    'fuelType',
    'transmissionType',
    'color',
    'configuration',
    'country',
    'mileage',
];

const InsuranceCompanyPage = () => {
    interface ImageFile {
        file: File;
        preview: string;
    }

    const [vinCode, setVinCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [description, setDescription] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [cursor, setCursor] = useState<number | null>(null);
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [accidents, setAccidents] = useState<string[]>([]);
    const [accidentsImages, setAccidentsImages] = useState<string[][]>([[]]);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);
    const [carData, setCarData] = useState<Car | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [pinataUrls, setPinataUrls] = useState<string[]>([]);
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

    const handleDrop = useCallback((acceptedFiles: File[]) => {
        const uploadedImages = acceptedFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setFiles((prevImages) => [...prevImages, ...uploadedImages]);
    }, []);
    const handleRemoveImage = (index: number) => {
        setFiles((prevImages) => prevImages.filter((_, i) => i !== index));
    };

    const uploadImagesToIPFS = async () => {
        try {
            const formData = new FormData();

            files.forEach((file) => {
                formData.append('images', file.file);
            });

            const response = await fetch('http://localhost:8080/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                console.log('IPFS URLs:', data.pinataUrls);
                setPinataUrls(data.pinataUrls);
                return data.pinataUrls;
            }
        } catch (error: any) {
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
        }
    };

    const handleSubmitAccident = async (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        try {
            const pinataRes = files.length ? await uploadImagesToIPFS() : [];
            console.log('IPFS files:', pinataRes);
            const tx = await contract?.addAccident(
                vinCode,
                description,
                pinataRes
            );

            setTxHash(tx.hash);
            setLoading(true);
            await tx.wait();

            setCarData((prevCarData) => {
                if (prevCarData) {
                    return {
                        ...prevCarData,
                        accidents: [
                            ...prevCarData.accidents,
                            {
                                date: Date.now() / 1000,
                                description: description,
                                images: pinataRes,
                            },
                        ],
                    };
                }
                return null;
            });
            setAccidentsImages((prevAccidentsImages) => [
                ...prevAccidentsImages,
                pinataRes,
            ]);
            setAccidents((prevAccidents) => [...prevAccidents, description]);
            setLoading(false);
            setFiles([]);
            setPinataUrls([]);
            setDescription('');
        } catch (error: any) {
            setLoading(false);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        if (inputRef.current && cursor !== null) {
            inputRef.current.setSelectionRange(cursor, cursor);
        }
    }, [vinCode, cursor]);

    const handleSearchButton = async (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        try {
            const carInfo = await contract?.getCarInfo(vinCode);
            console.log(carInfo);
            if (carInfo.brand) {
                setCarData(carInfo);
                console.log(carInfo);
                setAccidents(
                    carInfo.accidents.map(
                        (accident: Accident) => accident.description
                    )
                );
                setAccidentsImages(
                    carInfo.accidents.map(
                        (accident: Accident) => accident.images
                    )
                );
            }
        } catch (error: any) {
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
            console.error('Error:', error);
        }
    };

    interface Props {
        onFileUpload: (files: File[]) => void;
    }

    const DragDropFileUpload: React.FC<Props> = ({ onFileUpload }) => {
        const onDrop = useCallback(
            (acceptedFiles: File[]) => {
                onFileUpload(acceptedFiles);
            },
            [onFileUpload]
        );

        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop,
        });

        return (
            <Paper
                {...getRootProps()}
                style={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: '100px',
                    width: 400,
                    borderRadius: 0,
                    boxShadow: 'none',
                }}
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <Typography>Drop files here...</Typography>
                ) : (
                    <Typography>
                        Drag and drop some files here, or click to select files
                    </Typography>
                )}
            </Paper>
        );
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
                <div className={styles.containerTop}>
                    <h1>Add Accident Details</h1>
                    <SearchBar
                        vinCode={vinCode}
                        setVinCode={setVinCode}
                        handleSearch={handleSearchButton}
                    />
                </div>
                {carData && (
                    <div className={styles.dashboard}>
                        <div>
                            <h2>Car Info</h2>
                            <CarInfo carData={carData} />
                        </div>
                        <div className={styles.accidentsBoard}>
                            <h2>Accidents</h2>
                            <div className={styles.controls}>
                                <div className={styles.uploadForm}>
                                    <div className={styles.description}>
                                        <TextField
                                            variant='outlined'
                                            margin='normal'
                                            required
                                            multiline
                                            rows={5}
                                            sx={{
                                                width: 600,
                                                borderBottom: 0,
                                            }}
                                            placeholder='Accident details'
                                            autoFocus
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className={styles.dragnDrop}>
                                        <DragDropFileUpload
                                            onFileUpload={handleDrop}
                                        />
                                        <div className={styles.imagesPreview}>
                                            {files.length > 0 && (
                                                <ImageList
                                                    sx={{
                                                        width: 600,
                                                        height: 300,
                                                    }}
                                                    cols={3}
                                                    rowHeight={164}
                                                >
                                                    {files.map(
                                                        (file, index) => (
                                                            <ImageListItem
                                                                key={index}
                                                            >
                                                                <img
                                                                    src={
                                                                        file.preview
                                                                    }
                                                                    style={{
                                                                        width: 100,
                                                                        height: 100,
                                                                        cursor: 'pointer',
                                                                        border: '1px solid',
                                                                    }}
                                                                    alt='Preview'
                                                                    onClick={() =>
                                                                        setSelectedImage(
                                                                            file.preview
                                                                        )
                                                                    }
                                                                />
                                                                <Button
                                                                    variant='contained'
                                                                    color='secondary'
                                                                    onClick={() =>
                                                                        handleRemoveImage(
                                                                            index
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        mb: 1,
                                                                        width: 102,
                                                                        borderTopRightRadius: 0,
                                                                        borderTopLeftRadius: 0,
                                                                    }}
                                                                >
                                                                    Clear
                                                                </Button>
                                                            </ImageListItem>
                                                        )
                                                    )}
                                                </ImageList>
                                            )}
                                        </div>
                                        <Button
                                            type='button'
                                            variant='contained'
                                            onClick={handleSubmitAccident}
                                            sx={{
                                                width: 600,
                                                borderTop: 0,
                                            }}
                                            disabled={!description}
                                        >
                                            Add accident
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.accidentsHistory}>
                                <h3>Accidents History</h3>
                                <Divider />
                                {accidents.length > 0 ? (
                                    <List sx={{ padding: 0, maxWidth: 600 }}>
                                        {accidents.map(
                                            (accidentInfo, index) => (
                                                <Card
                                                    key={index}
                                                    className={styles.service}
                                                >
                                                    <ListItem divider>
                                                        <ListItemText
                                                            style={{
                                                                wordWrap:
                                                                    'break-word',
                                                            }}
                                                            primary={`Accident #${
                                                                index + 1
                                                            } - Date: ${convertTimestamp(
                                                                carData
                                                                    .accidents[
                                                                    index
                                                                ].date
                                                            )}: ${accidentInfo}`}
                                                        />
                                                    </ListItem>

                                                    <ListItem>
                                                        {accidentsImages[
                                                            index
                                                        ] &&
                                                            accidentsImages[
                                                                index
                                                            ].length > 0 && (
                                                                <ImageList
                                                                    sx={{
                                                                        width: 600,
                                                                        maxHeight: 250,
                                                                        position:
                                                                            'relative',
                                                                        overflow:
                                                                            'auto',
                                                                        '& ul': {
                                                                            padding: 0,
                                                                        },
                                                                    }}
                                                                    cols={5}
                                                                    rowHeight={
                                                                        100
                                                                    }
                                                                >
                                                                    {accidentsImages[
                                                                        index
                                                                    ].map(
                                                                        (
                                                                            accidentImg,
                                                                            imgIndex
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
                                ) : (
                                    <ListItem divider>
                                        <ListItemText
                                            primary={`No accidents history`}
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
            <ExpandImageDialog
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
            />
            <TransactionProcessingDialog loading={loading} txHash={txHash} />
        </div>
    );
};

export default InsuranceCompanyPage;
