const fs = require('fs-extra');
const path = require('path');

const DATA_ROOT = path.join(__dirname, 'data');
const PROJECTS_ROOT = path.join(DATA_ROOT, 'projects');
const INDEX_ROOT = path.join(DATA_ROOT, 'index');

/**
 * Initialize the data directory structure
 */
async function initStorage() {
    await fs.ensureDir(PROJECTS_ROOT);
    await fs.ensureDir(INDEX_ROOT);

    const tagsPath = path.join(INDEX_ROOT, 'tags.json');
    if (!(await fs.pathExists(tagsPath))) {
        await fs.writeJson(tagsPath, { tags: [] });
    }

    const searchIndexPath = path.join(INDEX_ROOT, 'search-index.json');
    if (!(await fs.pathExists(searchIndexPath))) {
        await fs.writeJson(searchIndexPath, { lastUpdated: new Date().toISOString(), files: {} });
    }
}

/**
 * PROJECTS
 */
async function getProjects() {
    const dirs = await fs.readdir(PROJECTS_ROOT);
    const projects = [];
    for (const dir of dirs) {
        const projectPath = path.join(PROJECTS_ROOT, dir);
        const stats = await fs.stat(projectPath);
        if (stats.isDirectory()) {
            const configPath = path.join(projectPath, 'project.json');
            let config = { name: dir, description: '', tags: [] };
            if (await fs.pathExists(configPath)) {
                config = await fs.readJson(configPath);
            }
            projects.push({ ...config, id: dir });
        }
    }
    return projects;
}

async function createProject(name) {
    const projectDir = name.toLowerCase().replace(/\s+/g, '-');
    const projectPath = path.join(PROJECTS_ROOT, projectDir);
    await fs.ensureDir(projectPath);
    await fs.ensureDir(path.join(projectPath, 'conversations'));
    await fs.ensureDir(path.join(projectPath, 'snapshots'));

    const config = { name, description: '', tags: [], createdAt: new Date().toISOString() };
    await fs.writeJson(path.join(projectPath, 'project.json'), config);
    return { ...config, id: projectDir };
}

async function updateProject(id, updates) {
    const projectPath = path.join(PROJECTS_ROOT, id);
    const configPath = path.join(projectPath, 'project.json');
    if (!(await fs.pathExists(configPath))) throw new Error('Project not found');

    const config = await fs.readJson(configPath);
    const newConfig = { ...config, ...updates, updatedAt: new Date().toISOString() };
    await fs.writeJson(configPath, newConfig);
    return { ...newConfig, id };
}

async function deleteProject(id) {
    const projectPath = path.join(PROJECTS_ROOT, id);
    await fs.remove(projectPath);
    return { success: true };
}

/**
 * CONVERSATIONS
 */
async function getConversations(projectId) {
    const convRoot = path.join(PROJECTS_ROOT, projectId, 'conversations');
    if (!(await fs.pathExists(convRoot))) return [];

    const files = await fs.readdir(convRoot);
    const conversations = [];
    for (const file of files) {
        const filePath = path.join(convRoot, file);
        if (file.endsWith('.json')) {
            const data = await fs.readJson(filePath);
            conversations.push({ id: file, title: data.title || file, ...data });
        } else if (file.endsWith('.md')) {
            const content = await fs.readFile(filePath, 'utf-8');
            conversations.push({ id: file, title: file, content, type: 'markdown' });
        }
    }
    return conversations;
}

async function saveConversation(projectId, name, content, metadata = {}, oldName = null) {
    const convRoot = path.join(PROJECTS_ROOT, projectId, 'conversations');
    const filePath = path.join(convRoot, `${name}.json`);

    // If renaming, remove old file
    if (oldName && oldName !== name) {
        const oldPath = path.join(convRoot, `${oldName}.json`);
        if (await fs.pathExists(oldPath)) {
            await fs.remove(oldPath);
        }
    }

    const data = {
        title: name,
        content,
        updatedAt: new Date().toISOString(),
        ...metadata
    };
    await fs.writeJson(filePath, data);
    return { id: `${name}.json`, ...data };
}

async function deleteConversation(projectId, conversationId) {
    const filePath = path.join(PROJECTS_ROOT, projectId, 'conversations', conversationId);
    await fs.remove(filePath);

    // Also remove snapshots
    const snapRoot = path.join(PROJECTS_ROOT, projectId, 'snapshots');
    const files = await fs.readdir(snapRoot);
    const prefix = conversationId.replace('.json', '');
    for (const file of files) {
        if (file.startsWith(prefix)) {
            await fs.remove(path.join(snapRoot, file));
        }
    }
    return { success: true };
}

/**
 * SNAPSHOTS
 */
async function saveSnapshot(projectId, conversationId, version) {
    const convPath = path.join(PROJECTS_ROOT, projectId, 'conversations', conversationId);
    const snapRoot = path.join(PROJECTS_ROOT, projectId, 'snapshots');
    const snapPath = path.join(snapRoot, `${conversationId.replace('.json', '')}_v${version}.json`);

    await fs.ensureDir(snapRoot);
    await fs.copy(convPath, snapPath);
    return { path: snapPath, version };
}

async function getSnapshots(projectId, conversationId) {
    const snapRoot = path.join(PROJECTS_ROOT, projectId, 'snapshots');
    if (!(await fs.pathExists(snapRoot))) return [];

    const files = await fs.readdir(snapRoot);
    const prefix = conversationId.replace('.json', '');
    const snapshots = [];

    for (const file of files) {
        if (file.startsWith(prefix) && file.endsWith('.json')) {
            const data = await fs.readJson(path.join(snapRoot, file));
            const versionMatch = file.match(/_v(\d+)\.json$/);
            snapshots.push({
                id: file,
                version: versionMatch ? `v${versionMatch[1]}` : 'v?',
                createdAt: data.updatedAt || new Date().toISOString(),
                content: data.content
            });
        }
    }
    return snapshots;
}

async function getAllTags() {
    const projects = await getProjects();
    const tagCounts = new Map();

    for (const project of projects) {
        const conversations = await getConversations(project.id);
        for (const conv of conversations) {
            if (conv.metadata && conv.metadata.tags) {
                conv.metadata.tags.forEach(tag => {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                });
            } else if (conv.tags) {
                conv.tags.forEach(tag => {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                });
            }
        }
    }
    return Object.fromEntries(tagCounts);
}

module.exports = {
    initStorage,
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getConversations,
    saveConversation,
    deleteConversation,
    saveSnapshot,
    getSnapshots,
    getAllTags
};
