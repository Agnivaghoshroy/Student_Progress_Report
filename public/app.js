// Global state
let currentModule = null;
let currentModuleId = null;
let modules = [];
let progress = null;
let startTime = Date.now();
let videoPlayer = null;
let lastVideoUpdate = 0;
let pdfScrollTimeout = null;
let isRetakingQuiz = false;

// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check login status
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    return isLoggedIn === 'true';
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    // Simple validation (in real app, this would call backend API)
    if (username && password) {
        // Store login state
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        
        // Hide login page and show dashboard
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainNav').classList.remove('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        
        // Initialize app
        initApp();
    } else {
        alert('Invalid credentials');
    }
}

// Reset all progress for demo purposes
async function resetProgress() {
    if (confirm('⚠️ This will reset ALL progress to 0%. Continue?')) {
        try {
            const response = await fetch(`${API_BASE}/progress/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success) {
                alert('✓ Progress has been reset! All modules are now at 0%. Page will reload.');
                // Reload the entire page to ensure clean state
                window.location.reload();
            } else {
                alert('Failed to reset progress. Please try again.');
            }
        } catch (error) {
            console.error('Reset failed:', error);
            alert(`Error resetting progress: ${error.message}\nPlease check if the server is running.`);
        }
    }
}

// Handle logout
function logout() {
    const rememberMe = localStorage.getItem('rememberMe');
    if (!rememberMe) {
        localStorage.removeItem('username');
    }
    localStorage.removeItem('isLoggedIn');
    
    // Show login page and hide dashboard
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('mainNav').classList.add('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    
    // Clear form
    document.getElementById('loginPassword').value = '';
}

// Initialize app
async function initApp() {
    try {
        // Load modules and progress
        await Promise.all([loadModules(), loadProgress()]);
        showDashboard();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to load data. Please refresh the page.');
    }
}

// Load all modules
async function loadModules() {
    const response = await fetch(`${API_BASE}/modules`);
    modules = await response.json();
}

// Load student progress
async function loadProgress() {
    const response = await fetch(`${API_BASE}/progress`);
    progress = await response.json();
    
    // Update student name (use stored username if available)
    const storedUsername = localStorage.getItem('username');
    document.getElementById('studentName').textContent = storedUsername || progress.studentName;
}

// Show dashboard view
async function showDashboard() {
    // Reload progress to get latest data FIRST
    await loadProgress();
    
    // Then show dashboard and render
    document.getElementById('dashboardView').classList.remove('hidden');
    document.getElementById('moduleView').classList.add('hidden');
    
    renderDashboard();
}

// Render dashboard
function renderDashboard() {
    const modulesList = document.getElementById('modulesList');
    
    // Calculate overall statistics
    const totalModules = progress.modules.length;
    const completedModules = progress.modules.filter(m => m.status === 'completed').length;
    const inProgressModules = progress.modules.filter(m => m.status === 'in-progress').length;
    const overallProgress = (completedModules / totalModules) * 100;
    
    const totalTimeSpent = progress.modules.reduce((sum, m) => sum + m.timeSpent, 0);
    const totalTimeHours = (totalTimeSpent / 3600).toFixed(1);
    
    const quizScores = progress.modules.filter(m => m.quizScore !== null).map(m => m.quizScore.percentage);
    const avgQuizScore = quizScores.length > 0 ? (quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(0) : 0;
    
    // Update overall progress
    document.getElementById('overallProgress').textContent = `${overallProgress.toFixed(0)}%`;
    document.getElementById('overallProgressBar').style.width = `${overallProgress}%`;
    document.getElementById('completedModules').textContent = completedModules;
    document.getElementById('inProgressModules').textContent = inProgressModules;
    document.getElementById('totalTimeSpent').textContent = `${totalTimeHours}h`;
    document.getElementById('avgQuizScore').textContent = `${avgQuizScore}%`;
    
    // Render module cards
    modulesList.innerHTML = modules.map((module, index) => {
        const moduleProgress = progress.modules.find(m => m.moduleId === module.id);
        const statusColor = {
            'completed': 'bg-green-100 text-green-800',
            'in-progress': 'bg-yellow-100 text-yellow-800',
            'not-started': 'bg-gray-100 text-gray-800'
        }[moduleProgress.status];
        
        const statusIcon = {
            'completed': 'fa-check-circle',
            'in-progress': 'fa-spinner',
            'not-started': 'fa-circle'
        }[moduleProgress.status];
        
        return `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onclick="openModule('${module.id}')">
                <div class="h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div class="p-6">
                    <div class="flex items-start justify-between mb-3">
                        <h3 class="text-xl font-bold text-gray-800">${module.title}</h3>
                        <span class="${statusColor} px-3 py-1 rounded-full text-xs font-semibold">
                            <i class="fas ${statusIcon} mr-1"></i>${moduleProgress.status.replace('-', ' ')}
                        </span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">${module.description}</p>
                    
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600"><i class="fas fa-video mr-2 text-blue-500"></i>Video</span>
                            <span class="font-semibold text-blue-600">${moduleProgress.videoProgress.toFixed(0)}%</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600"><i class="fas fa-book mr-2 text-green-500"></i>Reading</span>
                            <span class="font-semibold text-green-600">${moduleProgress.pdfProgress.toFixed(0)}%</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600"><i class="fas fa-question-circle mr-2 text-purple-500"></i>Quiz</span>
                            <span class="font-semibold text-purple-600">${moduleProgress.quizScore ? moduleProgress.quizScore.percentage.toFixed(0) + '%' : 'Not taken'}</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                        <span><i class="far fa-clock mr-1"></i>${(moduleProgress.timeSpent / 60).toFixed(0)} min</span>
                        <span><i class="fas fa-eye mr-1"></i>${moduleProgress.visits} visits</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Open module detail
async function openModule(moduleId) {
    currentModuleId = moduleId;
    currentModule = modules.find(m => m.id === moduleId);
    
    document.getElementById('dashboardView').classList.add('hidden');
    document.getElementById('moduleView').classList.remove('hidden');
    
    // Update module header
    document.getElementById('moduleTitle').textContent = currentModule.title;
    document.getElementById('moduleDescription').textContent = currentModule.description;
    
    // Update progress indicators
    const moduleProgress = progress.modules.find(m => m.moduleId === moduleId);
    document.getElementById('moduleVideoProgress').textContent = `${moduleProgress.videoProgress.toFixed(0)}%`;
    document.getElementById('modulePdfProgress').textContent = `${moduleProgress.pdfProgress.toFixed(0)}%`;
    document.getElementById('moduleQuizScore').textContent = moduleProgress.quizScore ? `${moduleProgress.quizScore.percentage.toFixed(0)}%` : 'Not taken';
    
    // Start time tracking
    startTime = Date.now();
    
    // Load video tab by default
    switchTab('video');
}

// Switch tabs
function switchTab(tab) {
    // Update tab styling
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('border-indigo-600', 'text-indigo-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    const tabButton = document.getElementById(`${tab}Tab`);
    tabButton.classList.remove('border-transparent', 'text-gray-500');
    tabButton.classList.add('border-indigo-600', 'text-indigo-600');
    
    // Load tab content
    const tabContent = document.getElementById('tabContent');
    
    switch(tab) {
        case 'video':
            loadVideoTab(tabContent);
            break;
        case 'pdf':
            loadPdfTab(tabContent);
            break;
        case 'quiz':
            loadQuizTab(tabContent);
            break;
    }
}

// Load video tab
function loadVideoTab(container) {
    const moduleProgress = progress.modules.find(m => m.moduleId === currentModuleId);
    
    container.innerHTML = `
        <div class="space-y-4">
            <div class="bg-black rounded-lg overflow-hidden">
                <video id="videoPlayer" class="w-full" controls>
                    <source src="${currentModule.videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p class="text-sm text-blue-800">
                    <i class="fas fa-info-circle mr-2"></i>
                    <strong>Auto-tracking enabled:</strong> Your video progress is being tracked automatically. 
                    Watch at least 95% to complete this section.
                </p>
            </div>
        </div>
    `;
    
    // Initialize video player tracking
    videoPlayer = document.getElementById('videoPlayer');
    
    videoPlayer.addEventListener('timeupdate', () => {
        const currentTime = videoPlayer.currentTime;
        const duration = videoPlayer.duration;
        const progressPercent = (currentTime / duration) * 100;
        
        // Update UI immediately for real-time feedback
        updateVideoProgressUI(progressPercent);
        
        // Update backend every 5 seconds to reduce API calls
        if (Date.now() - lastVideoUpdate > 5000) {
            updateVideoProgress(progressPercent);
            lastVideoUpdate = Date.now();
        }
    });
    
    videoPlayer.addEventListener('ended', () => {
        updateVideoProgress(100);
    });
}

// Update video progress UI immediately (real-time)
function updateVideoProgressUI(progressPercent) {
    const moduleProgress = progress.modules.find(m => m.moduleId === currentModuleId);
    if (moduleProgress) {
        moduleProgress.videoProgress = progressPercent;
        
        // Update the progress display in module header
        const videoProgressElem = document.getElementById('moduleVideoProgress');
        if (videoProgressElem) {
            videoProgressElem.textContent = `${progressPercent.toFixed(0)}%`;
        }
    }
}

// Update video progress in backend
async function updateVideoProgress(progress) {
    const timeSpent = (Date.now() - startTime) / 1000;
    startTime = Date.now();
    
    try {
        const response = await fetch(`${API_BASE}/progress/video`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                moduleId: currentModuleId,
                progress: progress,
                timeSpent: timeSpent
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Update local progress with server data
            const moduleProgress = progress.modules.find(m => m.moduleId === currentModuleId);
            Object.assign(moduleProgress, data.moduleProgress);
            
            // Update UI with exact server values
            document.getElementById('moduleVideoProgress').textContent = `${data.moduleProgress.videoProgress.toFixed(0)}%`;
            
            // Update status if changed
            updateModuleStatusIndicator(data.moduleProgress);
        }
    } catch (error) {
        console.error('Failed to update video progress:', error);
    }
}

// Load PDF tab
function loadPdfTab(container) {
    const moduleProgress = progress.modules.find(m => m.moduleId === currentModuleId);
    
    container.innerHTML = `
        <div class="space-y-4">
            <div class="bg-gray-100 rounded-lg overflow-hidden relative" style="height: 600px;">
                <iframe id="pdfViewer" src="${currentModule.pdfUrl}" class="w-full h-full" frameborder="0"></iframe>
                
                <!-- Progress Overlay -->
                <div id="readingProgressOverlay" class="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 border-2 border-green-500">
                    <div class="flex items-center space-x-3">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600" id="readingProgressPercent">${moduleProgress.pdfProgress.toFixed(0)}%</div>
                            <div class="text-xs text-gray-600">Reading</div>
                        </div>
                        <div class="w-16 h-16">
                            <svg class="transform -rotate-90" width="64" height="64">
                                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" stroke-width="6" fill="none"/>
                                <circle id="readingProgressCircle" cx="32" cy="32" r="28" 
                                    stroke="#10b981" stroke-width="6" fill="none"
                                    stroke-dasharray="${2 * Math.PI * 28}"
                                    stroke-dashoffset="${2 * Math.PI * 28 * (1 - moduleProgress.pdfProgress / 100)}"
                                    style="transition: stroke-dashoffset 0.5s ease"/>
                            </svg>
                        </div>
                    </div>
                    <div id="readingTimeRemaining" class="mt-2 text-xs text-center text-gray-500">
                        Keep reading actively...
                    </div>
                </div>
            </div>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p class="text-sm text-blue-800">
                    <i class="fas fa-clock mr-2"></i>
                    <strong>How it works:</strong> Your reading progress increases automatically as you actively engage with the material. 
                    Move your mouse, scroll, or interact with the document. Complete reading takes approximately <strong>3 minutes</strong> of active time.
                </p>
            </div>
            
            <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p class="text-sm text-green-800">
                    <i class="fas fa-info-circle mr-2"></i>
                    <strong>Tip:</strong> Reach at least <strong>80% reading progress</strong> along with 95% video progress and quiz completion to mark this module as complete.
                </p>
            </div>
        </div>
    `;
    
    // Simple time-based reading progress tracking
    const iframe = document.getElementById('pdfViewer');
    let currentProgress = moduleProgress.pdfProgress;
    let activeSeconds = Math.floor((currentProgress / 100) * 180); // 3 minutes total = 180 seconds
    let isActive = false;
    let trackingInterval = null;
    
    const progressPercentElem = document.getElementById('readingProgressPercent');
    const progressCircleElem = document.getElementById('readingProgressCircle');
    const timeRemainingElem = document.getElementById('readingTimeRemaining');
    const circleCircumference = 2 * Math.PI * 28;
    
    // Update visual progress indicator
    function updateProgressVisual(percent) {
        progressPercentElem.textContent = `${Math.floor(percent)}%`;
        const offset = circleCircumference * (1 - percent / 100);
        progressCircleElem.style.strokeDashoffset = offset;
        
        // Update time remaining message
        const secondsRemaining = Math.max(0, 180 - activeSeconds);
        const minutesRemaining = Math.ceil(secondsRemaining / 60);
        
        if (percent >= 100) {
            timeRemainingElem.textContent = '✓ Reading complete!';
            timeRemainingElem.classList.add('text-green-600', 'font-semibold');
        } else if (isActive) {
            timeRemainingElem.textContent = `~${minutesRemaining} min remaining`;
        } else {
            timeRemainingElem.textContent = 'Move mouse to continue...';
        }
    }
    
    // Detect user activity
    const markActive = () => { isActive = true; };
    
    iframe.parentElement.addEventListener('mousemove', markActive);
    iframe.parentElement.addEventListener('mouseenter', markActive);
    iframe.parentElement.addEventListener('click', markActive);
    document.addEventListener('mousemove', markActive);
    
    // Try to track activity inside iframe
    iframe.addEventListener('load', function() {
        try {
            const iframeWindow = iframe.contentWindow;
            if (iframeWindow) {
                iframeWindow.addEventListener('scroll', markActive);
                iframeWindow.addEventListener('mousemove', markActive);
                iframeWindow.addEventListener('click', markActive);
            }
        } catch (e) {
            // Cross-origin - rely on container events
        }
        
        // Start progress tracking (updates every second)
        trackingInterval = setInterval(() => {
            if (isActive && currentProgress < 100) {
                activeSeconds += 1;
                // 180 seconds (3 minutes) = 100%
                const newProgress = Math.min((activeSeconds / 180) * 100, 100);
                
                if (newProgress > currentProgress) {
                    currentProgress = newProgress;
                    
                    // Update UI
                    updateProgressVisual(currentProgress);
                    updatePdfProgressUI(currentProgress);
                    
                    // Update backend every 5% or when complete
                    if (Math.floor(newProgress) % 5 === 0 || newProgress >= 100) {
                        updatePdfProgress(currentProgress);
                    }
                }
                
                isActive = false; // Reset activity flag
            } else if (currentProgress >= 100) {
                clearInterval(trackingInterval);
            }
            
            // Update visual even when not progressing
            updateProgressVisual(currentProgress);
        }, 1000);
    });
    
    // Initial visual update
    updateProgressVisual(currentProgress);
}

// Update PDF progress UI immediately (real-time)
function updatePdfProgressUI(progressPercent) {
    const moduleProgress = progress.modules.find(m => m.moduleId === currentModuleId);
    if (moduleProgress) {
        moduleProgress.pdfProgress = progressPercent;
        
        // Update the progress display in module header
        const pdfProgressElem = document.getElementById('modulePdfProgress');
        if (pdfProgressElem) {
            pdfProgressElem.textContent = `${progressPercent.toFixed(0)}%`;
        }
    }
}

// Update PDF progress in backend
async function updatePdfProgress(progress) {
    const timeSpent = (Date.now() - startTime) / 1000;
    startTime = Date.now();
    
    try {
        const response = await fetch(`${API_BASE}/progress/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                moduleId: currentModuleId,
                progress: progress,
                timeSpent: timeSpent
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Update local progress with server data
            const moduleProgress = progress.modules.find(m => m.moduleId === currentModuleId);
            Object.assign(moduleProgress, data.moduleProgress);
            
            // Update UI with exact server values
            document.getElementById('modulePdfProgress').textContent = `${data.moduleProgress.pdfProgress.toFixed(0)}%`;
            
            // Update status if changed
            updateModuleStatusIndicator(data.moduleProgress);
        }
    } catch (error) {
        console.error('Failed to update PDF progress:', error);
    }
}

// Load quiz tab
function loadQuizTab(container) {
    const moduleProgress = progress.modules.find(m => m.moduleId === currentModuleId);
    const attempts = moduleProgress.quizAttempts || 0;
    
    // Check if we should show quiz results or quiz form
    const shouldShowResults = moduleProgress.quizScore && !isRetakingQuiz;
    
    if (shouldShowResults && attempts >= 2) {
        // Show final results after 2 attempts
        const quizScore = moduleProgress.quizScore;
        const isPerfect = quizScore.score === quizScore.totalQuestions;
        
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="inline-block p-8 ${isPerfect ? 'bg-green-50' : 'bg-blue-50'} rounded-full mb-6">
                    <i class="fas ${isPerfect ? 'fa-trophy' : 'fa-check-circle'} text-6xl ${isPerfect ? 'text-yellow-500' : 'text-blue-500'}"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">${isPerfect ? 'Perfect Score!' : 'Quiz Completed!'}</h3>
                <div class="text-5xl font-bold ${isPerfect ? 'text-green-600' : 'text-blue-600'} mb-4">${quizScore.percentage.toFixed(0)}%</div>
                <p class="text-gray-600 mb-2">
                    Attempt ${quizScore.attempt}: You scored ${quizScore.score} out of ${quizScore.totalQuestions} questions correctly.
                </p>
                <p class="text-sm text-gray-500 mb-6">
                    You've completed all ${attempts} attempts for this quiz.
                </p>
                ${!isPerfect && quizScore.answers ? generateAnswerReview() : ''}
            </div>
        `;
    } else if (shouldShowResults && attempts === 1) {
        // Show results after first attempt with retake option
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="inline-block p-8 bg-blue-50 rounded-full mb-6">
                    <i class="fas fa-check-circle text-6xl text-blue-500"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">First Attempt Complete!</h3>
                <div class="text-5xl font-bold text-blue-600 mb-4">${moduleProgress.quizScore.percentage.toFixed(0)}%</div>
                <p class="text-gray-600 mb-4">
                    You scored ${moduleProgress.quizScore.score} out of ${moduleProgress.quizScore.totalQuestions} questions correctly.
                </p>
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6 text-left max-w-xl mx-auto">
                    <p class="text-sm text-yellow-800">
                        <i class="fas fa-lightbulb mr-2"></i>
                        <strong>Want to improve?</strong> You can retake the quiz one more time with helpful hints for each question!
                    </p>
                </div>
                <button onclick="retakeQuiz()" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                    <i class="fas fa-redo mr-2"></i>Retake Quiz with Hints
                </button>
            </div>
        `;
    } else {
        // Show quiz questions (first attempt or retaking)
        const isSecondAttempt = attempts === 1;
        
        // Reset retaking flag after using it
        if (isRetakingQuiz) {
            isRetakingQuiz = false;
        }
        container.innerHTML = `
            <div id="quizContainer">
                <div class="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mb-6">
                    <p class="text-sm text-purple-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        ${isSecondAttempt ? 
                            '<strong>Second Attempt:</strong> Hints are now available for each question! Answer all questions to complete the quiz.' : 
                            '<strong>First Attempt:</strong> Answer all questions and submit to complete the quiz. You need 70% to pass.'}
                    </p>
                </div>
                <form id="quizForm" class="space-y-6">
                    ${currentModule.quiz.map((q, index) => `
                        <div class="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 class="font-semibold text-gray-800 mb-4">
                                <span class="inline-block w-8 h-8 bg-indigo-600 text-white rounded-full text-center leading-8 mr-2">${index + 1}</span>
                                ${q.question}
                            </h4>
                            ${isSecondAttempt ? `
                                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 ml-10">
                                    <p class="text-sm text-yellow-800">
                                        <i class="fas fa-lightbulb mr-2"></i><strong>Hint:</strong> ${q.hint}
                                    </p>
                                </div>
                            ` : ''}
                            <div class="space-y-3 ml-10">
                                ${q.options.map((option, optIndex) => `
                                    <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                        <input type="radio" name="question${index}" value="${optIndex}" class="mr-3 w-4 h-4 text-indigo-600" required>
                                        <span class="text-gray-700">${escapeHtml(option)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    <button type="submit" class="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition text-lg font-semibold">
                        <i class="fas fa-paper-plane mr-2"></i>Submit Quiz
                    </button>
                </form>
            </div>
        `;
        
        document.getElementById('quizForm').addEventListener('submit', submitQuiz);
    }
}

// Generate answer review showing correct answers for wrong questions
function generateAnswerReview() {
    const moduleProgress = progress.modules.find(m => m.moduleId === currentModuleId);
    if (!moduleProgress.quizScore || !moduleProgress.quizScore.answers) return '';
    
    const userAnswers = moduleProgress.quizScore.answers;
    let reviewHTML = '<div class="mt-8 max-w-3xl mx-auto text-left"><h4 class="text-xl font-bold text-gray-800 mb-4">Answer Review</h4>';
    
    currentModule.quiz.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === q.correct;
        
        if (!isCorrect) {
            reviewHTML += `
                <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
                    <p class="font-semibold text-gray-800 mb-2">
                        <span class="inline-block w-6 h-6 bg-red-500 text-white rounded-full text-center text-sm leading-6 mr-2">${index + 1}</span>
                        ${q.question}
                    </p>
                    <p class="text-sm text-red-700 ml-8 mb-1">
                        <i class="fas fa-times-circle mr-2"></i>Your answer: ${escapeHtml(q.options[userAnswer])}
                    </p>
                    <p class="text-sm text-green-700 ml-8">
                        <i class="fas fa-check-circle mr-2"></i>Correct answer: ${escapeHtml(q.options[q.correct])}
                    </p>
                </div>
            `;
        }
    });
    
    reviewHTML += '</div>';
    return reviewHTML;
}

// Submit quiz
async function submitQuiz(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    let score = 0;
    const userAnswers = [];
    
    currentModule.quiz.forEach((q, index) => {
        const answer = parseInt(formData.get(`question${index}`));
        userAnswers.push(answer);
        if (answer === q.correct) {
            score++;
        }
    });
    
    const timeSpent = (Date.now() - startTime) / 1000;
    
    try {
        const response = await fetch(`${API_BASE}/progress/quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                moduleId: currentModuleId,
                score: score,
                totalQuestions: currentModule.quiz.length,
                timeSpent: timeSpent,
                answers: userAnswers
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Update local progress
            const moduleProgress = progress.modules.find(m => m.moduleId === currentModuleId);
            Object.assign(moduleProgress, data.moduleProgress);
            
            // Update UI
            document.getElementById('moduleQuizScore').textContent = `${data.moduleProgress.quizScore.percentage.toFixed(0)}%`;
            
            // Update status if changed
            updateModuleStatusIndicator(data.moduleProgress);
            
            // Reload progress from server
            await loadProgress();
            
            // Show success message
            alert(`Quiz submitted! You scored ${score}/${currentModule.quiz.length} (${data.moduleProgress.quizScore.percentage.toFixed(0)}%)`);
            
            // Reload quiz tab to show results
            loadQuizTab(document.getElementById('tabContent'));
        }
    } catch (error) {
        console.error('Failed to submit quiz:', error);
        alert('Failed to submit quiz. Please try again.');
    }
}

// Retake quiz
function retakeQuiz() {
    // Set flag to show quiz form instead of results
    isRetakingQuiz = true;
    // Reload the quiz tab - it will now show the quiz form with hints
    loadQuizTab(document.getElementById('tabContent'));
}

// Update module status indicator in real-time
function updateModuleStatusIndicator(moduleProgress) {
    // Update the module header progress indicators
    const videoProgressElem = document.getElementById('moduleVideoProgress');
    const pdfProgressElem = document.getElementById('modulePdfProgress');
    const quizScoreElem = document.getElementById('moduleQuizScore');
    
    if (videoProgressElem) {
        videoProgressElem.textContent = `${moduleProgress.videoProgress.toFixed(0)}%`;
    }
    if (pdfProgressElem) {
        pdfProgressElem.textContent = `${moduleProgress.pdfProgress.toFixed(0)}%`;
    }
    if (quizScoreElem) {
        quizScoreElem.textContent = moduleProgress.quizScore ? `${moduleProgress.quizScore.percentage.toFixed(0)}%` : 'Not taken';
    }
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (checkLoginStatus()) {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainNav').classList.remove('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        initApp();
    } else {
        // Show login page
        document.getElementById('loginPage').classList.remove('hidden');
        
        // Pre-fill username if remembered
        const rememberedUsername = localStorage.getItem('username');
        const rememberMe = localStorage.getItem('rememberMe');
        if (rememberedUsername && rememberMe) {
            document.getElementById('loginUsername').value = rememberedUsername;
            document.getElementById('rememberMe').checked = true;
        }
    }
    
    // Attach login form handler
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});
