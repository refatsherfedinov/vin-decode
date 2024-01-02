import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Menu.module.css';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GarageIcon from '@mui/icons-material/Garage';
import CarCrashIcon from '@mui/icons-material/CarCrash';

const Menu: React.FC = () => {
    return (
        <nav className={styles.menu}>
            <ul className={styles.menuList}>
                <li>
                    <NavLink
                        to='/'
                        className={({ isActive }) =>
                            isActive
                                ? `${styles.navLink} ${styles.navLinkActive}`
                                : `${styles.navLink}`
                        }
                    >
                        Home
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to='/admin'
                        className={({ isActive }) =>
                            isActive
                                ? `${styles.navLink} ${styles.navLinkActive}`
                                : `${styles.navLink}`
                        }
                    >
                        Admin
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to='/dealer'
                        className={({ isActive }) =>
                            isActive
                                ? `${styles.navLink} ${styles.navLinkActive}`
                                : `${styles.navLink}`
                        }
                    >
                        Dealer
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to='/traffic'
                        className={({ isActive }) =>
                            isActive
                                ? `${styles.navLink} ${styles.navLinkActive}`
                                : `${styles.navLink}`
                        }
                    >
                        Traffic
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to='/insurance'
                        className={({ isActive }) =>
                            isActive
                                ? `${styles.navLink} ${styles.navLinkActive}`
                                : `${styles.navLink}`
                        }
                    >
                        Insurance
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
};

export default Menu;
