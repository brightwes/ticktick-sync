class TaskTagger {
    constructor() {
        console.log('TaskTagger constructor called');
        this.tasks = [];
        this.currentTaskIndex = 0;
        this.processedTasks = 0;
        this.accessToken = null;
        this.init();
    }

    init() {
        // Check for access token in URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            this.accessToken = token;
            // Clear the token from URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
        
        // Initialize elements first
        if (!this.initializeElements()) {
            console.error('Failed to initialize elements, showing login prompt');
            this.showLoginPrompt();
            return;
        }
        
        this.bindEvents();
        this.loadTasks();
    }
    
    initializeElements() {
        try {
            this.taskContainer = document.getElementById('taskContainer');
            this.loading = document.getElementById('loading');
            this.refreshBtn = document.getElementById('refreshBtn');
            this.nextBtn = document.getElementById('nextBtn');
            this.resetBtn = document.getElementById('resetBtn');
            this.totalTasksEl = document.getElementById('totalTasks');
            this.processedTasksEl = document.getElementById('processedTasks');
            this.remainingTasksEl = document.getElementById('remainingTasks');
            
            if (!this.taskContainer) {
                console.error('taskContainer element not found');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error initializing elements:', error);
            return false;
        }
    }
    
    bindEvents() {
        try {
            if (this.refreshBtn) {
                this.refreshBtn.addEventListener('click', () => this.loadTasks());
            }
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.nextTask());
            }
            if (this.resetBtn) {
                this.resetBtn.addEventListener('click', () => this.resetProcessedTasks());
            }
        } catch (error) {
            console.error('Error binding events:', error);
        }
    }
    
    async loadTasks() {
        try {
            this.showLoading();
            
            console.log('Fetching tasks from /api/tasks...');
            const response = await fetch('/api/tasks', {
                headers: this.accessToken ? {
                    'Authorization': `Bearer ${this.accessToken}`
                } : {}
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.log('Error data:', errorData);
                
                if (response.status === 401 && errorData.requiresAuth) {
                    if (errorData.authUrl) {
                        console.log('Redirecting to auth URL:', errorData.authUrl);
                        // Redirect to TickTick OAuth2 authorization
                        window.location.href = errorData.authUrl;
                        return;
                    } else {
                        console.log('Showing login prompt');
                        this.showLoginPrompt();
                        return;
                    }
                }
                throw new Error('Failed to fetch tasks');
            }
            
            this.tasks = await response.json();
            this.currentTaskIndex = 0;
            this.processedTasks = 0;
            
            this.updateStats();
            this.showCurrentTask();
        } catch (error) {
            console.error('Error in loadTasks:', error);
            this.showError('Failed to load tasks: ' + error.message);
        }
    }
    
    showLoginPrompt() {
        this.taskContainer.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-lock"></i>
                <h3>Authentication Required</h3>
                <p>Please authenticate with TickTick to access your tasks.</p>
                <button class="btn btn-primary" onclick="taskTagger.authenticateWithTickTick()">
                    <i class="fas fa-sign-in-alt"></i> Login with TickTick
                </button>
            </div>
        `;
    }
    
    authenticateWithTickTick() {
        // This will be handled by the API redirect
        this.loadTasks();
    }
    
    showLoading() {
        this.loading.style.display = 'block';
        this.taskContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading tasks...</p>
            </div>
        `;
    }
    
    showError(message) {
        this.taskContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
    
    showCurrentTask() {
        if (this.tasks.length === 0) {
            this.showNoTasks();
            return;
        }
        
        const task = this.tasks[this.currentTaskIndex];
        this.renderTask(task);
    }
    
    showNoTasks() {
        this.taskContainer.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-info-circle"></i>
                <h3>No Tasks Found</h3>
                <p>Either you have no unprocessed tasks, or you need to configure your TickTick credentials.</p>
            </div>
        `;
        this.nextBtn.style.display = 'none';
    }
    
    renderTask(task) {
        const allTags = [
            'work', 'personal', 'urgent', 'important', 'low-priority', 
            'creative', 'detailed', 'review', 'meeting', 'project',
            'health', 'family', 'shopping', 'travel', 'exercise'
        ];
        
        const suggestedTags = task.suggestedTags || [];
        
        let tagsHTML = '';
        
        // Suggested tags section
        if (suggestedTags.length > 0) {
            tagsHTML += `
                <div class="suggested-tags">
                    <h4><i class="fas fa-lightbulb"></i> Suggested Tags</h4>
                    <div class="tags-grid">
            `;
            
            suggestedTags.forEach(tag => {
                tagsHTML += `
                    <input type="checkbox" id="tag-${tag}" class="tag-checkbox" value="${tag}" checked>
                    <label for="tag-${tag}" class="tag-label suggested">${tag}</label>
                `;
            });
            
            tagsHTML += '</div></div>';
        }
        
        // All available tags section
        tagsHTML += `
            <div class="tags-section">
                <h3><i class="fas fa-tags"></i> Available Tags</h3>
                <div class="tags-grid">
        `;
        
        allTags.forEach(tag => {
            const isSuggested = suggestedTags.includes(tag);
            const checked = isSuggested ? 'checked' : '';
            const suggestedClass = isSuggested ? 'suggested' : '';
            
            tagsHTML += `
                <input type="checkbox" id="tag-${tag}" class="tag-checkbox" value="${tag}" ${checked}>
                <label for="tag-${tag}" class="tag-label ${suggestedClass}">${tag}</label>
            `;
        });
        
        tagsHTML += '</div></div>';
        
        this.taskContainer.innerHTML = `
            <div class="task-card active">
                <div class="task-header">
                    <h2 class="task-title">${this.escapeHtml(task.title)}</h2>
                    ${task.content ? `<div class="task-content">${this.escapeHtml(task.content)}</div>` : ''}
                    <div class="task-meta">
                        <span><i class="fas fa-calendar"></i> ${task.dueDate || 'No due date'}</span>
                        <span><i class="fas fa-list"></i> ${task.projectName || 'No project'}</span>
                        <span><i class="fas fa-clock"></i> ${task.priority || 'Normal'}</span>
                    </div>
                </div>
                ${tagsHTML}
                <div class="controls">
                    <button class="btn btn-primary" onclick="taskTagger.saveTask()">
                        <i class="fas fa-save"></i> Save & Continue
                    </button>
                </div>
            </div>
        `;
        
        this.nextBtn.style.display = 'none';
    }
    
    async saveTask() {
        const selectedTags = Array.from(document.querySelectorAll('input[name="tags"]:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedTags.length === 0) {
            alert('Please select at least one tag');
            return;
        }

        try {
            const currentTask = this.tasks[this.currentTaskIndex];
            const response = await fetch(`/api/tasks/${currentTask.id}/tags`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.accessToken ? `Bearer ${this.accessToken}` : ''
                },
                body: JSON.stringify({ tags: selectedTags })
            });

            if (!response.ok) {
                throw new Error('Failed to save task');
            }

            // Mark as processed and move to next
            this.processedTasks++;
            this.currentTaskIndex++;
            this.updateStats();
            
            if (this.currentTaskIndex >= this.tasks.length) {
                this.showCompletion();
            } else {
                this.showCurrentTask();
            }
        } catch (error) {
            this.showError('Failed to save task: ' + error.message);
        }
    }
    
    nextTask() {
        this.currentTaskIndex++;
        
        if (this.currentTaskIndex >= this.tasks.length) {
            // All tasks processed
            this.showNoTasks();
        } else {
            this.showCurrentTask();
        }
        
        this.updateStats();
    }
    
    updateStats() {
        this.totalTasksEl.textContent = this.tasks.length;
        this.processedTasksEl.textContent = this.processedTasks;
        this.remainingTasksEl.textContent = this.tasks.length - this.processedTasks;
    }
    
    // Add method to reset processed tasks (for testing)
    async resetProcessedTasks() {
        try {
            const response = await fetch('/api/reset-processed', {
                method: 'POST'
            });
            
            if (response.ok) {
                this.loadTasks(); // Reload tasks after reset
            }
        } catch (error) {
            console.error('Failed to reset processed tasks:', error);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
let taskTagger;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing TaskTagger...');
    
    // Add a visible test message
    const testDiv = document.createElement('div');
    testDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 9999;';
    testDiv.textContent = 'JS LOADED';
    document.body.appendChild(testDiv);
    
    try {
        taskTagger = new TaskTagger();
    } catch (error) {
        console.error('Error initializing TaskTagger:', error);
        testDiv.textContent = 'JS ERROR: ' + error.message;
    }
}); 