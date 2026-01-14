/**
 * English Homework Tracker App
 * Logic for managing tasks, vocabulary, and strict B2 topic usage.
 */

// State
let tasks = JSON.parse(localStorage.getItem('englishTasks')) || [];
let currentTags = [];
const studentNameKey = 'englishStudentName';

const TOPICS = [
    "Verb Patterns",
    "Phrasal Verbs",
    "Modal Verbs",
    "Conditionals",
    "The Passive Voice",
    "Causatives",
    "Wish and Hope",
    "Reported Speech"
];

// Wait for DOM to be ready before accessing elements
document.addEventListener('DOMContentLoaded', () => {
    initialize();
});

// Global references for inline handlers (optional, but good for onclick in HTML)
let lastFocusedInput = null;

function initialize() {
    // DOM Elements lookup
    const taskForm = document.getElementById('taskForm');
    const phraseInput = document.getElementById('phrase');
    const topicsContainer = document.getElementById('topicsContainer');
    const topicError = document.getElementById('topicError');
    const taskList = document.getElementById('taskList');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const toast = document.getElementById('toast');
    const studentNameInput = document.getElementById('studentName');

    // Editor Mode Elements
    const editorModeToggle = document.getElementById('editorModeToggle');
    const simpleEditor = document.getElementById('simpleEditor');
    const advancedEditor = document.getElementById('advancedEditor');
    const stepInputs = ['step1', 'step2', 'step3', 'step4'].map(id => document.getElementById(id));

    // Default focus
    lastFocusedInput = phraseInput;

    // --- Initialization Steps ---

    // 1. Render Topics
    if (topicsContainer) {
        topicsContainer.innerHTML = '';
        TOPICS.forEach(topic => {
            const chip = document.createElement('div');
            chip.className = 'topic-option';
            chip.textContent = topic;
            chip.onclick = () => {
                topicError.classList.add('hidden');
                if (currentTags.includes(topic)) {
                    currentTags = currentTags.filter(t => t !== topic);
                    chip.classList.remove('selected');
                } else {
                    currentTags.push(topic);
                    chip.classList.add('selected');
                }
            };
            topicsContainer.appendChild(chip);
        });
    }

    // 2. Load Tasks
    renderTasks();

    // 3. Load Saved Name
    const savedName = localStorage.getItem(studentNameKey);
    if (savedName && studentNameInput) {
        studentNameInput.value = savedName;
    }

    // 4. Load Vocabulary
    loadVocabulary();

    // --- Event Listeners ---

    // Form Submit
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();

            let phrase = '';
            // Determine phrase content based on active mode
            if (editorModeToggle && editorModeToggle.checked) {
                // Advanced Mode
                const parts = stepInputs.map((input) => {
                    const val = input.value.trim();
                    return val ? val : null;
                }).filter(p => p !== null);

                phrase = parts.join(' ');
            } else {
                // Simple Mode
                phrase = phraseInput.value.trim();
            }

            if (!phrase) {
                showToast('⚠️ La frase no puede estar vacía');
                return;
            }

            if (currentTags.length === 0) {
                if (topicError) topicError.classList.remove('hidden');
                return;
            }

            const newTask = {
                id: Date.now(),
                phrase: phrase,
                lessons: [...currentTags],
                createdAt: new Date().toLocaleDateString()
            };

            tasks.unshift(newTask);
            saveTasks();
            renderTasks();

            // Reset Form
            phraseInput.value = '';
            stepInputs.forEach(input => input.value = '');
            currentTags = [];
            document.querySelectorAll('.topic-option').forEach(c => c.classList.remove('selected'));
            if (topicError) topicError.classList.add('hidden');

            showToast('Tarea guardada satisfactoriamente');
        });
    }

    // Student Name Persistence
    if (studentNameInput) {
        studentNameInput.addEventListener('input', (e) => {
            localStorage.setItem(studentNameKey, e.target.value);
        });
    }

    // Copy & Clear Buttons
    if (copyAllBtn) copyAllBtn.addEventListener('click', copyAllTasks);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllTasks);

    // Editor Mode Toggle
    if (editorModeToggle && simpleEditor && advancedEditor) {
        const updateMode = () => {
            if (editorModeToggle.checked) {
                simpleEditor.classList.add('hidden');
                advancedEditor.classList.remove('hidden');
                lastFocusedInput = stepInputs[0]; // Focus first step
            } else {
                advancedEditor.classList.add('hidden');
                simpleEditor.classList.remove('hidden');
                lastFocusedInput = phraseInput;
            }
        };
        editorModeToggle.addEventListener('change', updateMode);
        // Initialize state
        updateMode();
    }

    // Focus Tracking
    const allInputsToTrack = [phraseInput, ...stepInputs].filter(el => el);
    allInputsToTrack.forEach(el => {
        el.addEventListener('focus', () => {
            lastFocusedInput = el;
        });
    });
}

// --- Helper Functions ---

function saveTasks() {
    localStorage.setItem('englishTasks', JSON.stringify(tasks));
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <p>No tienes tareas guardadas aún. ¡Añade tu primera frase arriba!</p>
            </div>
        `;
        return;
    }

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';

        const tagsHtml = task.lessons.map(lesson =>
            `<span class="tag" style="background: rgba(255,255,255,0.1); border:none; color: var(--text-secondary);">${lesson}</span>`
        ).join('');

        card.innerHTML = `
            <div class="task-phrase">${escapeHtml(task.phrase)}</div>
            <div class="tags-container" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
                ${tagsHtml}
            </div>
            <div class="task-footer">
                <small style="color: var(--text-secondary); font-size: 0.8rem;">${task.createdAt}</small>
                <button class="delete-btn" onclick="deleteTask(${task.id})">Borrar</button>
            </div>
        `;
        taskList.appendChild(card);
    });
}

function deleteTask(id) {
    if (confirm('¿Estás seguro de que quieres borrar esta tarea?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }
}
// Expose globally for inline onclick
window.deleteTask = deleteTask;

function copyAllTasks() {
    if (tasks.length === 0) return;
    const studentName = document.getElementById('studentName')?.value.trim() || 'Estudiante';
    const date = new Date().toLocaleDateString();
    const includeTopics = document.getElementById('includeTopicsToggle')?.checked;

    let text = `ENTREGA DE TAREAS\n------------------\n`;
    text += `Estudiante: ${studentName}\n`;
    text += `Fecha de entrega: ${date}\n\n`;
    text += `TAREAS:\n`;
    text += tasks.map(t => {
        const lessons = (includeTopics && t.lessons.length > 0) ? ` [${t.lessons.join(', ')}]` : '';
        return `- ${t.phrase}${lessons}`;
    }).join('\n');

    navigator.clipboard.writeText(text).then(() => showToast('Entrega copiada!')).catch(e => console.error(e));
}

function clearAllTasks() {
    if (tasks.length === 0) return;
    if (confirm('⚠️ ¿Borrar TODAS las tareas? Esta acción es irreversible.')) {
        tasks = [];
        saveTasks();
        renderTasks();
        showToast('Todas las tareas borradas');
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Vocabulary Logic ---

async function loadVocabulary() {
    const wordsContainer = document.getElementById('wordsListContainer');
    const verbsContainer = document.getElementById('verbsListContainer');

    // Safety check
    if (!wordsContainer || !verbsContainer) return;

    wordsContainer.innerHTML = '';
    verbsContainer.innerHTML = '';

    try {
        // Load Words
        const wordsRes = await fetch('sergio_words.csv');
        if (wordsRes.ok) {
            const text = await wordsRes.text();
            const data = parseWordsCSV(text);
            renderVocabulary(data, wordsContainer);
        } else {
            wordsContainer.innerHTML = '<p class="error-msg">No se pudo cargar.</p>';
        }

        // Load Verbs
        const verbsRes = await fetch('verbs.csv');
        if (verbsRes.ok) {
            const text = await verbsRes.text();
            const verbs = parseVerbsCSV(text);
            // Render verbs independently
            renderVerbs("Lista de Verbos", verbs, verbsContainer);
        } else {
            verbsContainer.innerHTML = '<p class="error-msg">No se pudo cargar.</p>';
        }

    } catch (e) {
        console.error('Data load error', e);
        if (wordsContainer) wordsContainer.innerHTML += '<p class="error-msg">Error cargando.</p>';
    }
}

function parseWordsCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const start = lines[0].toLowerCase().includes('palabra') ? 1 : 0;
    const results = {};

    for (let i = start; i < lines.length; i++) {
        const line = lines[i];
        const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
        let match, matches = [];
        while ((match = regex.exec(line))) {
            matches.push((match[1] || match[2] || '').trim());
        }

        if (matches.length >= 3) {
            const [word, section, ...defs] = matches;
            const definition = defs.join(', ').replace(/^, /, '');
            if (!results[section]) results[section] = [];
            results[section].push({ word, definition });
        }
    }
    return results;
}

function parseVerbsCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const start = lines[0].toLowerCase().includes('verb') ? 1 : 0;
    const verbs = lines.slice(start).map(l => l.replace(/,$/, '').trim()).filter(Boolean);
    return verbs.sort((a, b) => a.localeCompare(b));
}

function renderVocabulary(data, container) {
    // Sort sections alphabetically if desired, or keep insertion order
    for (const [section, items] of Object.entries(data)) {
        const group = document.createElement('div');
        group.className = 'vocab-group';

        const h3 = document.createElement('h3');
        h3.textContent = section;
        h3.onclick = () => group.classList.toggle('collapsed');
        group.appendChild(h3);

        const list = document.createElement('ul');
        list.className = 'vocab-list';

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'vocab-item';
            li.textContent = item.word;
            li.setAttribute('data-tooltip', item.definition);
            li.onclick = () => addToPhrase(item.word);
            list.appendChild(li);
        });

        group.appendChild(list);
        container.appendChild(group);
    }
}

function renderVerbs(title, listData, container) {
    // For verbs, we might just put them all in one big list or group by letter if huge.
    // Given the request, just listed alphabetically is fine.

    // We can wrap them in a pseudo-group so they look consistent, OR just direct list.
    // Let's use a single open group to match style.
    const list = document.createElement('ul');
    list.className = 'vocab-list';

    listData.forEach(word => {
        const li = document.createElement('li');
        li.className = 'vocab-item verb-item';
        li.textContent = word;
        li.onclick = () => addToPhrase(word);
        list.appendChild(li);
    });

    container.appendChild(list);
}

function addToPhrase(text) {
    if (!lastFocusedInput) return;
    const val = lastFocusedInput.value;
    const sep = (val && !val.endsWith(' ')) ? ' ' : '';
    lastFocusedInput.value = val + sep + text;
    lastFocusedInput.focus();
}

// --- Card Management UI ---
function toggleCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    card.classList.toggle('collapsed');
    const btn = card.querySelector('.toggle-btn');
    if (btn) {
        btn.textContent = card.classList.contains('collapsed') ? '▼' : '▲';
        btn.style.transform = card.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
}
window.toggleCard = toggleCard;

// Drag and Drop Logic
document.addEventListener('DOMContentLoaded', () => {
    // ... previous listeners ...

    const draggables = document.querySelectorAll('.vocab-card-container');
    const leftSidebar = document.getElementById('leftSidebar');

    if (leftSidebar && draggables.length) {
        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', () => {
                draggable.classList.add('dragging');
            });

            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('dragging');
            });
        });

        leftSidebar.addEventListener('dragover', e => {
            e.preventDefault(); // Enable dropping
            const afterElement = getDragAfterElement(leftSidebar, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (draggable) {
                if (afterElement == null) {
                    leftSidebar.appendChild(draggable);
                } else {
                    leftSidebar.insertBefore(draggable, afterElement);
                }
            }
        });
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.vocab-card-container:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
