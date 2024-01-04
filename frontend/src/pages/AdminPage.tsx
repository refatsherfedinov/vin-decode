import { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import useAllowedUserAddress from '../utils/checkIsAddressAllowed';
import {
    useSmartContract,
    useUserAddress,
} from '../components/ContractContext/ContractContext';
import { Switch } from '@mui/material';
import TransactionProcessingDialog from '../components/TransactionProcessingDialog/TransactionProcessingDialog';
import ErrorMessageDialog from '../components/ErrorMessageDialog/ErrorMessageDialog';
import styles from './AdminPage.module.css';
import { ethers } from 'ethers';

const AdminPage = () => {
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const contract = useSmartContract();
    const provider = new ethers.providers.Web3Provider(
        (window as any).ethereum
    );
    const [balance, setBalance] = useState<string | null>(null);
    const userAddress = useUserAddress();
    const [loading, setLoading] = useState<boolean>(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);
    const checkIsAddressAllowed = useAllowedUserAddress();

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            // Only for testing purposes
            const tx = await contract?.ACTIVATE_SUPER_USER();
            setLoading(true);
            setTxHash(tx.hash);
            await tx.wait();
            setIsAuthorized(true);
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            setErrorMessage(JSON.stringify(error.reason));
            setIsErrorDialogOpen(true);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const result = await checkIsAddressAllowed(
                    contract,
                    userAddress
                );
                setIsAuthorized(result);
                const stateAddress = await contract?.state();
                if (!stateAddress) {
                    return;
                }
                const balanceWei = await provider.getBalance(
                    stateAddress.toString()
                );
                const balanceEther = ethers.utils.formatEther(
                    balanceWei.toString()
                );
                console.log(balanceEther.toString());
                setBalance(balanceEther);
            } catch (error: any) {
                setErrorMessage(JSON.stringify(error.reason));
                setIsErrorDialogOpen(true);
            }
        };

        init();
    }, [userAddress]);

    const switchWidth = 300;
    const defaultSwitchWidth = 62;
    const scaleFactor = switchWidth / defaultSwitchWidth;

    return (
        <div>
            <Header />
            <div className={styles.container}>
                <h1>Admin Dashboard</h1>
                <div className={styles.contols}>
                    <Switch
                        checked={isAuthorized}
                        onChange={handleChange}
                        inputProps={{ 'aria-label': 'controlled' }}
                        disabled={isAuthorized || !userAddress}
                        sx={{
                            transform: `scale(${scaleFactor})`,
                            mb: 2,
                            mt: 2,
                        }}
                    />
                </div>
                {!userAddress && <p>Connect wallet to get started</p>}
                {isAuthorized ? (
                    <div>
                        <h2>Government budget: {balance?.toString()} SepETH</h2>
                        <p>
                            {' '}
                            You have admin rights to use every page in this App
                        </p>
                    </div>
                ) : (
                    <p>
                        You are not the admin, switch the toggle to get
                        admin(Only for testing purposes)
                    </p>
                )}

                <div>
                    <p>
                        {' '}
                        but remember "With great power comes great
                        responsibility"(c)
                    </p>
                </div>

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

export default AdminPage;
