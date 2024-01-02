import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface ErrorMessageDialogProps {
    errorMessage: string;
    open: boolean;
    onClose: () => void;
}

const ErrorMessageDialog: React.FC<ErrorMessageDialogProps> = ({
    errorMessage,
    open,
    onClose,
}) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <IconButton
                onClick={onClose}
                style={{ position: 'absolute', right: 0, top: 0 }}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent>
                <p>{errorMessage}</p>
            </DialogContent>
        </Dialog>
    );
};

export default ErrorMessageDialog;
