const express = require('express');
const cors = require('cors');
const storage = require('./storage');
const parser = require('./parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Connect to MongoDB before starting (for non-serverless environments)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    storage.initStorage().catch(err => {
        console.error('Initial MongoDB connection failed:', err.message);
    });
}

app.get('/', (req, res) => {
    res.send('Local Command Center API is running');
});

// Middleware to ensure storage is initialized
app.use(async (req, res, next) => {
    try {
        await storage.initStorage();
        next();
    } catch (err) {
        res.status(500).send({ error: 'Failed to initialize storage', details: err.message });
    }
});

/**
 * PROJECTS API
 */
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await storage.getProjects();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const project = await storage.createProject(name);
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await storage.updateProject(id, req.body);
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await storage.deleteProject(id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * CONVERSATIONS API
 */
app.get('/api/projects/:projectId/conversations', async (req, res) => {
    try {
        const { projectId } = req.params;
        const conversations = await storage.getConversations(projectId);
        res.json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/projects/:projectId/conversations', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, content, metadata = {} } = req.body;
        if (!name || !content) return res.status(400).json({ error: 'Name and content are required' });

        // Auto-parse TOC and sections
        const toc = parser.extractTOC(content);
        const sections = parser.splitSections(content);

        const enrichedMetadata = {
            ...metadata,
            toc,
            sections
        };

        const conversation = await storage.saveConversation(projectId, name, content, enrichedMetadata);
        res.json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/projects/:projectId/conversations/:conversationId', async (req, res) => {
    try {
        const { projectId, conversationId } = req.params;
        const { title, content, metadata = {} } = req.body;

        // Auto-parse TOC and sections if content is provided
        let enrichedMetadata = metadata;
        if (content) {
            const toc = parser.extractTOC(content);
            const sections = parser.splitSections(content);
            enrichedMetadata = {
                ...metadata,
                toc,
                sections
            };
        }

        const name = title || conversationId.replace('.json', '');
        const oldName = conversationId.replace('.json', '');
        const conversation = await storage.saveConversation(projectId, name, content, enrichedMetadata, oldName);
        res.json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/projects/:projectId/conversations/:conversationId', async (req, res) => {
    try {
        const { projectId, conversationId } = req.params;
        const result = await storage.deleteConversation(projectId, conversationId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * SEARCH API
 */
app.get('/api/tags', async (req, res) => {
    try {
        const tags = await storage.getAllTags();
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const { q, projectId } = req.query;
        if (!q) return res.status(400).json({ error: 'Search query is required' });

        const projects = await storage.getProjects();
        const results = [];

        for (const project of projects) {
            if (projectId && project.id !== projectId) continue;

            const conversations = await storage.getConversations(project.id);
            for (const conv of conversations) {
                if (conv.content && conv.content.toLowerCase().includes(q.toLowerCase())) {
                    results.push({
                        projectId: project.id,
                        projectName: project.name,
                        conversationId: conv.id,
                        conversationTitle: conv.title,
                        snippet: conv.content.substring(0, 200) + '...'
                    });
                }
            }
        }
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * SNAPSHOTS API
 */
app.get('/api/projects/:projectId/conversations/:conversationId/snapshots', async (req, res) => {
    try {
        const { projectId, conversationId } = req.params;
        // Logic to list snapshots for a specific conversation
        const snapshots = await storage.getSnapshots(projectId, conversationId);
        res.json(snapshots);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/projects/:projectId/conversations/:conversationId/snapshots', async (req, res) => {
    try {
        const { projectId, conversationId } = req.params;
        const { version } = req.body;
        if (!version) return res.status(400).json({ error: 'Version is required' });
        const result = await storage.saveSnapshot(projectId, conversationId, version);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend in production (optional for now)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'textgpt/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'textgpt/dist/index.html'));
    });
}

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
