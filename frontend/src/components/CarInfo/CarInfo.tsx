import React from 'react';
import styles from './CarInfo.module.css';
import {
    Card,
    Grid,
    List,
    ListItem,
    ListItemText,
    Paper,
    Typography,
} from '@mui/material';

export type Car = {
    brand: string;
    model: string;
    fuelType: string;
    transmissionType: string;
    color: string;
    configuration: string;
    country: string;
    plateNumbers: string[];
    owners: string[];
    year: number;
    mileage: number;
};

const carInfoKeys: Partial<Record<keyof Car, string>> = {
    brand: 'Brand',
    model: 'Model',
    fuelType: 'FuelType',
    transmissionType: 'Transmission type',
    color: 'Color',
    configuration: 'Configuration',
    country: 'Country',
    year: 'Year',
    mileage: 'Mileage',
    plateNumbers: 'Plate Number',
    owners: 'Owner',
};

type CarInfoProps = {
    carData: Car;
};

const CarInfo: React.FC<CarInfoProps> = (props) => {
    const { carData } = props;

    return (
        <List style={{ width: 500 }}>
            {Object.keys(carInfoKeys).map((key) => {
                const value = carData[key as keyof Car];
                let displayValue;

                if (Array.isArray(value)) {
                    displayValue =
                        value.length > 0 ? value.join(', ') : 'NOT REGISTERED';
                } else {
                    displayValue = value ? value : 'NOT REGISTERED';
                }

                return (
                    <Card key={key}>
                        <ListItem divider key={key}>
                            <Grid container justifyContent='space-between'>
                                <Grid item>
                                    <ListItemText
                                        primary={carInfoKeys[key as keyof Car]}
                                    />
                                </Grid>
                                <Grid item>
                                    <ListItemText
                                        primary={displayValue.toString()}
                                    />
                                </Grid>
                            </Grid>
                        </ListItem>
                    </Card>
                );
            })}
        </List>
    );
};

export default CarInfo;
