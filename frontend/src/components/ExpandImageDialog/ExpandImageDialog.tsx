import { Dialog } from '@mui/material';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';

interface ExpandImageDialogProps {
    selectedImage: string | null;
    setSelectedImage: React.Dispatch<React.SetStateAction<string | null>>;
}
const ExpandImageDialog: React.FC<ExpandImageDialogProps> = ({
    selectedImage,
    setSelectedImage,
}) => {
    return (
        <Dialog open={selectedImage !== null}>
            <IconButton
                onClick={() => setSelectedImage(null)}
                style={{ position: 'absolute', right: 0, top: 0 }}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent>
                {selectedImage && (
                    <img
                        src={selectedImage}
                        style={{ width: '100%' }}
                        alt='Selected'
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ExpandImageDialog;
