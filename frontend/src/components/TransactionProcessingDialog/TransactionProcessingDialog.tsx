import { CircularProgress, Dialog } from '@mui/material';
import styles from './TransactionProcessingDialog.module.css';

interface TransactionProcessingDialogProps {
    loading: boolean;
    txHash: string | null;
}

const TransactionProcessingDialog: React.FC<
    TransactionProcessingDialogProps
> = ({ loading, txHash }) => {
    return (
        <Dialog open={loading}>
            <div className={styles.processingTrx}>
                <CircularProgress />
                {txHash && (
                    <p>
                        transaction submitted waiting for confirmation. Check
                        the detailes of transaction here:{' '}
                        <a
                            href={`https://sepolia.etherscan.io/tx/${txHash}`}
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            Etherscan
                        </a>
                    </p>
                )}
            </div>
        </Dialog>
    );
};

export default TransactionProcessingDialog;
