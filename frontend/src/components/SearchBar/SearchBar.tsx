import React, { useState, useRef, useEffect } from 'react';
import styles from './SearchBar.module.css';
import { Button, TextField } from '@mui/material';

type SearchBarProps = {
    vinCode: string | null;
    setVinCode: React.Dispatch<React.SetStateAction<string | null>>;
    handleSearch: (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({
    vinCode,
    setVinCode,
    handleSearch,
}) => {
    const [isValid, setIsValid] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const [cursor, setCursor] = useState<number | null>(null);

    const validateVinCode = (value: string) => {
        const vinCodeRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
        return vinCodeRegex.test(value) || value === '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cursorPosition = e.target.selectionStart;
        setCursor(cursorPosition);

        const value = e.target.value.toUpperCase();
        setVinCode(value);
        setIsValid(validateVinCode(value));
    };
    useEffect(() => {
        if (inputRef.current && cursor !== null) {
            inputRef.current.setSelectionRange(cursor, cursor);
        }
    }, [vinCode, cursor]);
    return (
        <div className={styles.search}>
            <TextField
                placeholder='VIN'
                name='vin'
                error={!isValid}
                inputRef={inputRef}
                onChange={handleChange}
                value={vinCode}
                InputProps={{
                    sx: {
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                    },
                }}
                sx={{
                    flex: 'auto',
                }}
            />

            <Button
                variant='contained'
                onClick={handleSearch}
                sx={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                }}
            >
                Search
            </Button>
        </div>
    );
};

export default SearchBar;
