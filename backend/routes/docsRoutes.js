import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const router = express.Router();
router.use(cors());
router.use(express.json());

// Documentation endpoint
router.get('/usage-docs/:docPath', async (req, res) => {
    try {
        const { docPath } = req.params;
        // Sanitize the path to prevent directory traversal
        const safePath = docPath.replace(/\.\.\//g, '').replace(/\//g, '');

        // Path to markdown files directory
        const projectRoot = path.join('.', '..', '..');
        const docsDir = path.join(projectRoot, 'docs');
        let filePath = path.join(docsDir, `${safePath}.md`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).send(`*404* Documentation Not Found\n\nThe requested document could not be loaded.`);
        }

        // Read and send the markdown file
        const content = fs.readFileSync(filePath, 'utf8');
        res.set('Content-Type', 'text/plain');
        res.send(content);
    } catch (error) {
        console.error('Error loading documentation:', error);
        res.status(500).send('Error loading documentation');
    }
});

export default router;
