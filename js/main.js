import { getDatabase, saveNewSubject, markAsMastered, getMasteredIds, deleteSubject as deleteSubjectData } from './data.js';
import { QuizSession } from './quiz.js';
import { View } from './view.js';

const appContainer = document.getElementById('app');
let currentSession = null; 

let draftSubject = {
    name: "",
    questions: [],
    id: null
};

const Controller = {
    init: () => {
        Controller.loadTheme();
        Controller.goHome();
    },

    // --- MOTYWY ---
    toggleTheme: () => {
        const themeLink = document.getElementById('theme-style');
        const currentTheme = themeLink.getAttribute('href');
        let newTheme = currentTheme.includes('style.css') && !currentTheme.includes('dark') 
            ? 'css/style_dark.css' : 'css/style.css';
        
        localStorage.setItem('app_theme', newTheme.includes('dark') ? 'dark' : 'light');
        themeLink.setAttribute('href', newTheme);
        const themeBtn = document.querySelector('.theme-toggle-btn');
        if (themeBtn) themeBtn.textContent = Controller.getThemeIcon();
    },

    loadTheme: () => {
        const savedTheme = localStorage.getItem('app_theme');
        const themeLink = document.getElementById('theme-style');
        themeLink.setAttribute('href', savedTheme === 'dark' ? 'css/style_dark.css' : 'css/style.css');
    },

    getThemeIcon: () => localStorage.getItem('app_theme') === 'dark' ? '☀️' : '🌙',

    goHome: () => {
        const db = getDatabase();
        let html = `<button class="theme-toggle-btn" onclick="window.app.toggleTheme()">${Controller.getThemeIcon()}</button><h1>Moje Quizy</h1>`;
        html += `<button class="btn" style="background:#6f42c1; margin-bottom:20px" onclick="window.app.openCreator()">+ DODAJ WŁASNĄ BAZĘ</button>`;
        html += `<div style="display:flex; gap:10px; margin-bottom:20px">
             <input type="file" id="import-file" accept=".json" style="display:none" onchange="window.app.handleFileImport(this)">
             <button class="btn" style="background:#20c997; flex:1" onclick="document.getElementById('import-file').click()">SZYBKI IMPORT</button>
        </div>`;
        html += db.map(s => View.homeCard(s)).join('');
        appContainer.innerHTML = html;
    },

    // --- KREATOR ---
    openCreator: () => {
        draftSubject = { name: "", questions: [], id: null };
        appContainer.innerHTML = `<button class="theme-toggle-btn" onclick="window.app.toggleTheme()">${Controller.getThemeIcon()}</button>` + View.creator();
        Controller.initCreator();
    },

    editSubject: (id) => {
        const db = getDatabase();
        const subject = db.find(s => s.id === id);
        if (!subject) return;
        draftSubject = JSON.parse(JSON.stringify(subject));
        appContainer.innerHTML = `<button class="theme-toggle-btn" onclick="window.app.toggleTheme()">${Controller.getThemeIcon()}</button>` + View.creator();
        document.getElementById('new-subject-name').value = draftSubject.name;
        Controller.updateDraftList();
        Controller.initCreator();
    },

    initCreator: () => {
        const answersWrap = document.getElementById('answers-wrap');
        answersWrap.innerHTML = ''; 
        for(let i = 0; i < 4; i++) answersWrap.innerHTML += View.answerInput(i);
    },

    addAnswerField: (value = "", isChecked = false) => {
        const answersWrap = document.getElementById('answers-wrap');
        const count = answersWrap.children.length;
        answersWrap.innerHTML += View.answerInput(count, value, isChecked);
    },

    removeAnswerField: (index) => {
        const rows = Array.from(document.querySelectorAll('.answer-row'));
        const newData = rows.map(row => ({
            text: row.querySelector('.answer-text').value,
            checked: row.querySelector('input[type="checkbox"]').checked
        }));
        newData.splice(index, 1);
        const answersWrap = document.getElementById('answers-wrap');
        answersWrap.innerHTML = '';
        newData.forEach((data, i) => Controller.addAnswerField(data.text, data.checked));
    },

    saveQuestionToDraft: () => {
        const qText = document.getElementById('q-text').value.trim();
        const rows = Array.from(document.querySelectorAll('.answer-row'));
        const answers = rows.map(r => r.querySelector('.answer-text').value.trim()).filter(v => v !== '');
        const correct = rows.map((r, i) => r.querySelector('input[type="checkbox"]').checked ? i : null).filter(v => v !== null);

        if(!qText || answers.length < 2 || correct.length === 0){
            alert("Wpisz pytanie, min. 2 odpowiedzi i zaznacz przynajmniej jedną poprawną!");
            return;
        }

        draftSubject.questions.push({ id: Date.now(), text: qText, answers, correct });
        document.getElementById('q-text').value = '';
        Controller.initCreator();
        Controller.updateDraftList();
    },

    updateDraftList: () => {
        document.getElementById('q-count').textContent = draftSubject.questions.length;
        document.getElementById('draft-list').innerHTML = draftSubject.questions.length ? 
            draftSubject.questions.map((q, idx) => View.draftItem(q, idx)).join('') : 
            '<p style="padding:10px; opacity:0.7">Brak pytań.</p>';
        Controller.renderMath();
    },

    editDraftQuestion: (index) => {
        const q = draftSubject.questions[index];
        document.getElementById('q-text').value = q.text;
        const answersWrap = document.getElementById('answers-wrap');
        answersWrap.innerHTML = '';
        q.answers.forEach((ans, i) => Controller.addAnswerField(ans, q.correct.includes(i)));
        draftSubject.questions.splice(index, 1);
        Controller.updateDraftList();
    },

    deleteDraftQuestion: (index) => {
        draftSubject.questions.splice(index, 1);
        Controller.updateDraftList();
    },

    saveDatabase: () => {
        const name = document.getElementById('new-subject-name').value;
        if(!name || draftSubject.questions.length === 0) return alert("Podaj nazwę i dodaj pytania!");
        draftSubject.name = name;
        if (!draftSubject.id) draftSubject.id = "custom_" + Date.now();
        saveNewSubject(draftSubject);
        alert("Zapisano!");
        Controller.goHome();
    },

    downloadJSON: () => {
        const name = document.getElementById('new-subject-name').value || "BezNazwy";
        if(draftSubject.questions.length === 0) return alert("Brak pytań!");
        draftSubject.name = name;
        const blob = new Blob([JSON.stringify(draftSubject)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${name}.json`; a.click();
    },

    loadDraftFromFile: (input) => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (json.questions) {
                    json.questions.forEach(q => {
                        if (typeof q.correct === 'number') q.correct = [q.correct];
                        if (!q.correct) q.correct = [];
                    });
                }
                draftSubject = { name: json.name, questions: json.questions, id: null };
                document.getElementById('new-subject-name').value = json.name;
                Controller.updateDraftList();
                input.value = ''; 
                alert(`Wczytano bazę: ${json.name}`);
            } catch (err) { 
                console.error(err); 
                alert("Błąd pliku! (Sprawdź konsolę F12 po szczegóły)"); 
            }
        };
        reader.readAsText(file);
    },

    handleFileImport: (input) => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                json.id = "import_" + Date.now();
                saveNewSubject(json);
                Controller.goHome();
            } catch (err) { alert("Błąd formatu!"); }
        };
        reader.readAsText(file);
    },

    // --- PODGLĄD / START ---

    openSubject: (id) => {
        const subject = getDatabase().find(s => s.id === id);
        if(subject) appContainer.innerHTML = `<button class="theme-toggle-btn" onclick="window.app.toggleTheme()">${Controller.getThemeIcon()}</button>` + View.subjectDetails(subject);
    },

    // NOWA FUNKCJA: Otwieranie widoku nauki (listy pytań)
    openStudyReview: (id) => {
        const subject = getDatabase().find(s => s.id === id);
        if (!subject) return;
        appContainer.innerHTML = View.studyList(subject);
        window.scrollTo(0, 0);
        Controller.renderMath();
    },

    deleteSubject: (id) => {
        if(confirm("Usunąć bazę?")) { deleteSubjectData(id); Controller.goHome(); }
    },

    startCustomExam: (subjectId) => {
        const input = document.getElementById('exam-count-input');
        if (!input) return;
        
        const count = parseInt(input.value);
        const subject = getDatabase().find(s => s.id === subjectId);
        if (!subject) return;

        if (isNaN(count) || count < 1) return alert("Podaj poprawną liczbę!");
        const finalCount = Math.min(count, subject.questions.length);
        window.app.startQuiz(subjectId, finalCount);
    },

    // --- QUIZ ---

    startQuiz: (subjectId, mode) => {
        const subject = getDatabase().find(s => s.id === subjectId);
        if (!subject) return;

        const mastered = getMasteredIds(subjectId); 
        currentSession = new QuizSession(subjectId, subject.questions, mode, mastered);
        Controller.renderCurrentQuestion();
    },

    renderCurrentQuestion: () => {
        appContainer.innerHTML = View.question(currentSession);
        Controller.renderMath();
    },

    restartQuiz: () => {
        if (!currentSession) return;
        currentSession.score = 0;
        currentSession.currentIndex = 0;
        currentSession.history = [];
        Controller.renderCurrentQuestion();
    },

    toggleSelection: (index) => {
        const checkbox = document.getElementById(`ans-${index}`);
        if (!checkbox) return;

        checkbox.checked = !checkbox.checked;
        checkbox.parentElement.classList.toggle('selected', checkbox.checked);

        const anySelected = document.querySelectorAll('.quiz-check:checked').length > 0;
        const submitBtn = document.getElementById('submit-answer-btn');
        if (submitBtn) {
            submitBtn.disabled = !anySelected;
        }
    },

    renderMath: () => {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(appContainer, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ],
                throwOnError: false
            });
        }
    },

    handleAnswer: () => {
        const submitBtn = document.getElementById('submit-answer-btn');
        if (!submitBtn || submitBtn.disabled) return;

        const selected = Array.from(document.querySelectorAll('.quiz-check'))
            .map((ch, i) => ch.checked ? i : null)
            .filter(v => v !== null);

        if (selected.length === 0) return;

        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.6";
        submitBtn.textContent = "Czekaj..."; 

        const isCorrect = currentSession.submitAnswer(selected);
        const q = currentSession.getCurrentQuestion();
        const rows = document.querySelectorAll('.answer-option');

        rows.forEach((row, i) => {
            const isRowCorrect = q.correct.includes(i);
            const isRowSelected = selected.includes(i);
            
            if (isRowCorrect) row.classList.add('btn-correct');
            else if (isRowSelected) row.classList.add('btn-wrong');
            
            row.style.pointerEvents = 'none';
        });

        if (isCorrect) markAsMastered(currentSession.subjectId, q.id);

        setTimeout(() => {
            if (currentSession.next()) {
                Controller.renderCurrentQuestion();
            } else {
                appContainer.innerHTML = `<button class="theme-toggle-btn" onclick="window.app.toggleTheme()">${Controller.getThemeIcon()}</button>` + View.results(currentSession);
                Controller.renderMath();
            }
        }, 2000);
    },
};

window.app = Controller;
Controller.init();