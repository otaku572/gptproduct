require('dotenv').config();
const mongoose = require('mongoose');

// Schemas
const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    tags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    content: String,
    metadata: {
        toc: Array,
        sections: Array,
        tags: [String]
    },
    updatedAt: { type: Date, default: Date.now }
});

const SnapshotSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    version: { type: String, required: true },
    content: String,
    createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', ProjectSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);
const Snapshot = mongoose.model('Snapshot', SnapshotSchema);

/**
 * Initialize MongoDB connection
 */
async function initStorage() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');
    }
}

/**
 * PROJECTS
 */
async function getProjects() {
    return await Project.find().lean();
}

async function createProject(name) {
    const project = new Project({ name });
    await project.save();
    return { ...project.toObject(), id: project._id };
}

async function updateProject(id, updates) {
    const project = await Project.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: Date.now() },
        { new: true }
    ).lean();
    if (!project) throw new Error('Project not found');
    return { ...project, id: project._id };
}

async function deleteProject(id) {
    await Project.findByIdAndDelete(id);
    await Conversation.deleteMany({ projectId: id });
    await Snapshot.deleteMany({ projectId: id });
    return { success: true };
}

/**
 * CONVERSATIONS
 */
async function getConversations(projectId) {
    const conversations = await Conversation.find({ projectId }).lean();
    return conversations.map(c => ({ ...c, id: c._id }));
}

async function saveConversation(projectId, name, content, metadata = {}, oldName = null) {
    // If it's an update (oldName exists) and we're looking for an existing one in this project
    // Note: The original logic used names as IDs. In MongoDB, we use _id.
    // However, the API still passes names/conversationId. 
    // Let's assume conversationId passed from API is the _id if it's a valid ObjectId string.
    
    let conversation;
    
    // Check if name or oldName can be used to find an existing one
    // In the original filesystem version, name was the ID.
    conversation = await Conversation.findOne({ projectId, title: oldName || name });

    if (conversation) {
        conversation.title = name;
        conversation.content = content;
        conversation.metadata = { ...conversation.metadata, ...metadata };
        conversation.updatedAt = Date.now();
        await conversation.save();
    } else {
        conversation = new Conversation({
            projectId,
            title: name,
            content,
            metadata
        });
        await conversation.save();
    }
    
    return { ...conversation.toObject(), id: conversation._id };
}

async function deleteConversation(projectId, conversationId) {
    // Determine if conversationId is _id or title
    const query = mongoose.Types.ObjectId.isValid(conversationId) 
        ? { _id: conversationId } 
        : { projectId, title: conversationId.replace('.json', '') };
        
    const conversation = await Conversation.findOne(query);
    if (conversation) {
        await Snapshot.deleteMany({ conversationId: conversation._id });
        await Conversation.deleteOne({ _id: conversation._id });
    }
    return { success: true };
}

/**
 * SNAPSHOTS
 */
async function saveSnapshot(projectId, conversationId, version) {
    const query = mongoose.Types.ObjectId.isValid(conversationId) 
        ? { _id: conversationId } 
        : { projectId, title: conversationId.replace('.json', '') };
        
    const conversation = await Conversation.findOne(query);
    if (!conversation) throw new Error('Conversation not found');

    const snapshot = new Snapshot({
        projectId,
        conversationId: conversation._id,
        version,
        content: conversation.content
    });
    await snapshot.save();
    return { id: snapshot._id, version };
}

async function getSnapshots(projectId, conversationId) {
    const query = mongoose.Types.ObjectId.isValid(conversationId) 
        ? { _id: conversationId } 
        : { projectId, title: conversationId.replace('.json', '') };
        
    const conversation = await Conversation.findOne(query);
    if (!conversation) return [];

    const snapshots = await Snapshot.find({ conversationId: conversation._id }).lean();
    return snapshots.map(s => ({
        id: s._id,
        version: s.version,
        createdAt: s.createdAt,
        content: s.content
    }));
}

async function getAllTags() {
    const conversations = await Conversation.find().lean();
    const tagCounts = new Map();

    conversations.forEach(conv => {
        const tags = conv.metadata?.tags || [];
        tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
    });
    
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
