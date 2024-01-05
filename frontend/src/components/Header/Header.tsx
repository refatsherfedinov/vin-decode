import Menu from '../Menu/Menu';
import React, { useEffect } from 'react';
import styles from '../../App.module.css';
import { ConnectKitButton } from 'connectkit';
const Header: React.FC = () => {
    return (
        <div className={styles.header}>
            VIN | Decode
            <Menu />
            <div>
                <ConnectKitButton />
            </div>
        </div>
    );
};
export default Header;
