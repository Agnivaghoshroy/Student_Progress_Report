const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data file paths
const PROGRESS_FILE = './data/progress.json';
const MODULES_FILE = './data/modules.json';

// Initialize data files if they don't exist
function initializeData() {
    if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
    
    if (!fs.existsSync(PROGRESS_FILE)) {
        const initialProgress = {
            studentId: "student_001",
            studentName: "John Doe",
            modules: [
                {
                    moduleId: "module_1",
                    status: "not-started",
                    videoProgress: 0,
                    pdfProgress: 0,
                    quizScore: null,
                    quizAttempts: 0,
                    timeSpent: 0,
                    visits: 0,
                    lastVisit: null,
                    startedAt: null,
                    completedAt: null
                },
                {
                    moduleId: "module_2",
                    status: "not-started",
                    videoProgress: 0,
                    pdfProgress: 0,
                    quizScore: null,
                    quizAttempts: 0,
                    timeSpent: 0,
                    visits: 0,
                    lastVisit: null,
                    startedAt: null,
                    completedAt: null
                },
                {
                    moduleId: "module_3",
                    status: "not-started",
                    videoProgress: 0,
                    pdfProgress: 0,
                    quizScore: null,
                    quizAttempts: 0,
                    timeSpent: 0,
                    visits: 0,
                    lastVisit: null,
                    startedAt: null,
                    completedAt: null
                }
            ]
        };
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(initialProgress, null, 2));
    }
    
    if (!fs.existsSync(MODULES_FILE)) {
        const modules = [
            {
                id: "module_1",
                title: "Introduction to Web Development",
                description: "Learn the basics of HTML, CSS, and JavaScript",
                hasVideo: true,
                hasPdf: true,
                hasQuiz: true,
                videoUrl: "/assets/sample-video.mp4",
                pdfUrl: "/assets/sample-pdf.pdf",
                quiz: [
                    {
                        question: "What does HTML stand for?",
                        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
                        correct: 0,
                        hint: "HTML is used to create the structure of web pages. Think about what 'markup' means in web development."
                    },
                    {
                        question: "Which tag is used for creating a paragraph?",
                        options: ["<p>", "<para>", "<pg>", "<paragraph>"],
                        correct: 0,
                        hint: "The tag is a single letter that stands for 'paragraph'."
                    },
                    {
                        question: "CSS stands for?",
                        options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
                        correct: 1,
                        hint: "CSS uses a 'cascade' to apply styles from general to specific rules."
                    }
                ]
            },
            {
                id: "module_2",
                title: "JavaScript Fundamentals",
                description: "Master JavaScript variables, functions, and DOM manipulation",
                hasVideo: true,
                hasPdf: true,
                hasQuiz: true,
                videoUrl: "/assets/Sample_Video_For_Video%20watch%20percentage%20module.mp4",
                pdfUrl: "/assets/Sample_PDF_For_Reading%20material%20engagement%20module.pdf",
                quiz: [
                    {
                        question: "Which keyword is used to declare a variable in JavaScript?",
                        options: ["var", "let", "const", "All of the above"],
                        correct: 3,
                        hint: "JavaScript has multiple ways to declare variables: var (old way), let (block-scoped), and const (constant)."
                    },
                    {
                        question: "What is the correct way to write a JavaScript array?",
                        options: ["var colors = 'red', 'green', 'blue'", "var colors = (1:'red', 2:'green', 3:'blue')", "var colors = ['red', 'green', 'blue']", "var colors = 1 = ('red'), 2 = ('green'), 3 = ('blue')"],
                        correct: 2,
                        hint: "Arrays in JavaScript use square brackets [] to hold multiple values."
                    }
                ]
            },
            {
                id: "module_3",
                title: "Backend Development with Node.js",
                description: "Build server-side applications with Node.js and Express",
                hasVideo: true,
                hasPdf: true,
                hasQuiz: true,
                videoUrl: "/assets/Sample_Video_For_Video%20watch%20percentage%20module.mp4",
                pdfUrl: "/assets/Sample_PDF_For_Reading%20material%20engagement%20module.pdf",
                quiz: [
                    {
                        question: "What is Node.js?",
                        options: ["A JavaScript framework", "A JavaScript runtime", "A database", "A web browser"],
                        correct: 1,
                        hint: "Node.js allows JavaScript to run outside the browser - it's an environment or 'runtime' for executing JavaScript."
                    },
                    {
                        question: "Which module is used to create a web server in Node.js?",
                        options: ["fs", "http", "path", "url"],
                        correct: 1,
                        hint: "Think about the protocol used for web communication - HTTP. Node.js has a built-in module named after it."
                    }
                ]
            }
        ];
        fs.writeFileSync(MODULES_FILE, JSON.stringify(modules, null, 2));
    }
}

// Helper function to read JSON files
function readJSON(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

// Helper function to write JSON files
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// API Routes

// Get all modules
app.get('/api/modules', (req, res) => {
    try {
        const modules = readJSON(MODULES_FILE);
        res.json(modules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load modules' });
    }
});

// Get specific module
app.get('/api/modules/:id', (req, res) => {
    try {
        const modules = readJSON(MODULES_FILE);
        const module = modules.find(m => m.id === req.params.id);
        if (module) {
            res.json(module);
        } else {
            res.status(404).json({ error: 'Module not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to load module' });
    }
});

// Get student progress
app.get('/api/progress', (req, res) => {
    try {
        const progress = readJSON(PROGRESS_FILE);
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load progress' });
    }
});

// Update video progress
app.post('/api/progress/video', (req, res) => {
    try {
        const { moduleId, progress, timeSpent } = req.body;
        const data = readJSON(PROGRESS_FILE);
        
        const moduleProgress = data.modules.find(m => m.moduleId === moduleId);
        if (moduleProgress) {
            moduleProgress.videoProgress = progress;
            moduleProgress.timeSpent += timeSpent || 0;
            moduleProgress.visits += 1;
            moduleProgress.lastVisit = new Date().toISOString();
            
            // Auto-update status
            if (progress > 0 && moduleProgress.status === 'not-started') {
                moduleProgress.status = 'in-progress';
                moduleProgress.startedAt = new Date().toISOString();
            }
            
            // Check if module is completed
            if (progress >= 95 && moduleProgress.pdfProgress >= 80 && moduleProgress.quizScore !== null) {
                moduleProgress.status = 'completed';
                moduleProgress.completedAt = new Date().toISOString();
            }
            
            writeJSON(PROGRESS_FILE, data);
            res.json({ success: true, moduleProgress });
        } else {
            res.status(404).json({ error: 'Module not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Update PDF progress
app.post('/api/progress/pdf', (req, res) => {
    try {
        const { moduleId, progress, timeSpent } = req.body;
        const data = readJSON(PROGRESS_FILE);
        
        const moduleProgress = data.modules.find(m => m.moduleId === moduleId);
        if (moduleProgress) {
            moduleProgress.pdfProgress = progress;
            moduleProgress.timeSpent += timeSpent || 0;
            moduleProgress.visits += 1;
            moduleProgress.lastVisit = new Date().toISOString();
            
            // Auto-update status
            if (progress > 0 && moduleProgress.status === 'not-started') {
                moduleProgress.status = 'in-progress';
                moduleProgress.startedAt = new Date().toISOString();
            }
            
            // Check if module is completed
            if (moduleProgress.videoProgress >= 95 && progress >= 80 && moduleProgress.quizScore !== null) {
                moduleProgress.status = 'completed';
                moduleProgress.completedAt = new Date().toISOString();
            }
            
            writeJSON(PROGRESS_FILE, data);
            res.json({ success: true, moduleProgress });
        } else {
            res.status(404).json({ error: 'Module not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Submit quiz
app.post('/api/progress/quiz', (req, res) => {
    try {
        const { moduleId, score, totalQuestions, timeSpent, answers } = req.body;
        const data = readJSON(PROGRESS_FILE);
        
        const moduleProgress = data.modules.find(m => m.moduleId === moduleId);
        if (moduleProgress) {
            // Increment attempt count
            moduleProgress.quizAttempts = (moduleProgress.quizAttempts || 0) + 1;
            
            // Store quiz score and answers
            moduleProgress.quizScore = { 
                score, 
                totalQuestions, 
                percentage: (score / totalQuestions) * 100,
                attempt: moduleProgress.quizAttempts,
                answers: answers // Store user's answers for showing correct answers later
            };
            
            moduleProgress.timeSpent += timeSpent || 0;
            moduleProgress.visits += 1;
            moduleProgress.lastVisit = new Date().toISOString();
            
            // Auto-update status
            if (moduleProgress.status === 'not-started') {
                moduleProgress.status = 'in-progress';
                moduleProgress.startedAt = new Date().toISOString();
            }
            
            // Check if module is completed
            if (moduleProgress.videoProgress >= 95 && moduleProgress.pdfProgress >= 80 && score >= totalQuestions * 0.7) {
                moduleProgress.status = 'completed';
                moduleProgress.completedAt = new Date().toISOString();
            }
            
            writeJSON(PROGRESS_FILE, data);
            res.json({ success: true, moduleProgress });
        } else {
            res.status(404).json({ error: 'Module not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});

// Reset all progress (for demo purposes)
app.post('/api/progress/reset', (req, res) => {
    try {
        const data = readJSON(PROGRESS_FILE);
        
        // Reset all module progress to initial state
        data.modules.forEach(module => {
            module.status = 'not-started';
            module.videoProgress = 0;
            module.pdfProgress = 0;
            module.quizScore = null;
            module.quizAttempts = 0;
            module.timeSpent = 0;
            module.visits = 0;
            module.lastVisit = null;
            module.startedAt = null;
            module.completedAt = null;
        });
        
        writeJSON(PROGRESS_FILE, data);
        res.json({ success: true, message: 'All progress has been reset' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset progress' });
    }
});

// Update time spent
app.post('/api/progress/time', (req, res) => {
    try {
        const { moduleId, timeSpent } = req.body;
        const data = readJSON(PROGRESS_FILE);
        
        const moduleProgress = data.modules.find(m => m.moduleId === moduleId);
        if (moduleProgress) {
            moduleProgress.timeSpent += timeSpent || 0;
            moduleProgress.lastVisit = new Date().toISOString();
            
            writeJSON(PROGRESS_FILE, data);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Module not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update time' });
    }
});

// Initialize data and start server
initializeData();

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Student Progress Tracking System is ready!`);
});
