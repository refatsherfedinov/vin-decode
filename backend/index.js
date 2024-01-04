const express = require('express');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.static(path.join(__dirname, 'build')));

const port = process.env.PORT || 3001;

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const upload = multer({ dest: 'uploads/' });
const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
});

app.post('/upload', upload.array('images'), async (req, res) => {
    try {
        const files = req.files;
        const pinataResponses = [];
        for (const file of files) {
            const result = await pinata.pinFromFS(file.path);
            pinataResponses.push(`https://ipfs.io/ipfs/${result.IpfsHash}`);
        }
        console.log(pinataResponses);
        res.json({ success: true, pinataUrls: pinataResponses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
