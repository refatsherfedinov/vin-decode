import express from 'express';
import multer from 'multer';
import pinataSDK from '@pinata/sdk';
import cors from 'cors';
import 'dotenv/config';

const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
});
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
const port = 8080;

app.post('/upload', upload.array('images'), async (req, res) => {
    try {
        const files = req.files as Express.Multer.File[];
        const pinataResponses = [];

        for (const file of files) {
            const result = await pinata.pinFromFS(file.path);
            pinataResponses.push(`https://ipfs.io/ipfs/${result.IpfsHash}`);
        }

        res.json({ success: true, pinataUrls: pinataResponses });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
