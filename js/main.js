import { getDatabase, saveNewSubject, markAsMastered, deleteSubject as deleteSubjectData } from './data.js';
import { QuizSession } from './quiz.js';
import { View } from './view.js';

const appContainer = document.getElementById('app');
let currentSession = null; 

let draftSubject = {
    name: "",
    questions: [],
    id: null // Dodajemy pole ID do stanu edytora
};

const Controller = {
    init: () => {
        Controller.loadTheme();
        Controller.goHome();
    },

    // --- MOTYWY (Bez zmian) ---
    toggleTheme: () => {
        const themeLink = document.getElementById('theme-style');
        const currentTheme = themeLink.getAttribute('href');
        let newTheme = '';

        if (currentTheme.includes('style.css') && !currentTheme.includes('dark')) {
            newTheme = 'css/style_dark.css';
            localStorage.setItem('app_theme', 'dark');
        } else {
            newTheme = 'css/style.css';
            localStorage.setItem('app_theme', 'light');
        }
        themeLink.setAttribute('href', newTheme);
        const themeBtn = document.querySelector('.theme-toggle-btn');
        if (themeBtn) themeBtn.textContent = Controller.getThemeIcon();
    },

    loadTheme: () => {
        const savedTheme = localStorage.getItem('app_theme');
        const themeLink = document.getElementById('theme-style');
        themeLink.setAttribute('href', savedTheme === 'dark' ? 'css/style_dark.css' : 'css/style.css');
    },

    getThemeIcon: () => {
        const savedTheme = localStorage.getItem('app_theme');
        return savedTheme === 'dark' ? '☀️' : '🌙';
    },

    // --- NAWIGACJA I EKRAN GŁÓWNY ---

    goHome: () => {
        const db = getDatabase();
        let html = `
        <button class="theme-toggle-btn" onclick="window.app.toggleTheme()">
            ${Controller.getThemeIcon()}
        </button>

        <h1>Moje Quizy</h1>`;
        
        html += `<button class="btn" style="background:#6f42c1; margin-bottom:20px" onclick="window.app.openCreator()">+ DODAJ WŁASNĄ BAZĘ</button>`;
        html += `<div style="display:flex; gap:10px; margin-bottom:20px">
             <input type="file" id="import-file" accept=".json" style="display:none" onchange="window.app.handleFileImport(this)">
             <button class="btn" style="background:#20c997; flex:1" onclick="document.getElementById('import-file').click()">SZYBKI IMPORT</button>
        </div>`;
        html += db.map(s => View.homeCard(s)).join('');
        appContainer.innerHTML = html;
    },

    // --- KREATOR I EDYCJA ---

    openCreator: () => {
        // Resetujemy draft (nowa baza)
        draftSubject = { name: "", questions: [], id: null };
        appContainer.innerHTML = `
        <button class="theme-toggle-btn" onclick="window.app.toggleTheme()">
            ${Controller.getThemeIcon()}
        </button>` + View.creator();
        Controller.initCreator();
    },

    // NOWE: Funkcja otwierająca kreator z danymi istniejącej bazy
    editSubject: (id) => {
        const db = getDatabase();
        const subject = db.find(s => s.id === id);
        if (!subject) return;

        // Kopiujemy dane do draftu (głęboka kopia dla bezpieczeństwa)
        draftSubject = JSON.parse(JSON.stringify(subject));

        // Ładujemy widok kreatora
        appContainer.innerHTML = `
        <button class="theme-toggle-btn" onclick="window.app.toggleTheme()">
            ${Controller.getThemeIcon()}
        </button>` + View.creator();

        // Ustawiamy nazwę w formularzu
        document.getElementById('new-subject-name').value = draftSubject.name;
        
        // Inicjalizujemy puste pola edytora pytania
        Controller.initCreator();
        
        // Wyświetlamy listę pytań z załadowanej bazy
        Controller.updateDraftList();
    },

    initCreator: () => {
        const answersWrap = document.getElementById('answers-wrap');
        answersWrap.innerHTML = ''; 
        for(let i = 0; i < 4; i++){
            answersWrap.innerHTML += View.answerInput(i);
        }
    },

    clearQuestionForm: () => {
        document.getElementById('q-text').value = '';
        const answersWrap = document.getElementById('answers-wrap');
        answersWrap.innerHTML = '';
        for(let i = 0; i < 4; i++){
            answersWrap.innerHTML += View.answerInput(i);
        }
    },

    addAnswerField: (value = "") => {
        const answersWrap = document.getElementById('answers-wrap');
        const count = answersWrap.children.length;
        answersWrap.innerHTML += View.answerInput(count, value);
    },

    removeAnswerField: (index) => {
        const answersWrap = document.getElementById('answers-wrap');
        const answerTexts = Array.from(document.querySelectorAll('.answer-text')).map(inp => inp.value);
        const checkedRadio = document.querySelector('input[name="correct-ans"]:checked');
        let correctIndex = checkedRadio ? parseInt(checkedRadio.value) : -1;

        answerTexts.splice(index, 1);
        if(correctIndex > index) correctIndex--;
        else if(correctIndex === index) correctIndex = -1; 

        answersWrap.innerHTML = '';
        answerTexts.forEach((val, i) => {
            answersWrap.innerHTML += View.answerInput(i, val);
        });

        if(correctIndex >= 0 && correctIndex < answerTexts.length){
            document.querySelector(`input[name="correct-ans"][value="${correctIndex}"]`).checked = true;
        }
    },

    saveQuestionToDraft: () => {
        const qText = document.getElementById('q-text').value.trim();
        const answerTexts = Array.from(document.querySelectorAll('.answer-text')).map(inp => inp.value.trim()).filter(v => v !== '');
        const correctRadio = document.querySelector('input[name="correct-ans"]:checked');

        if(!qText || answerTexts.length < 2){
            alert("Wpisz pytanie i przynajmniej dwie odpowiedzi!");
            return;
        }
        if(!correctRadio){
            alert("Zaznacz poprawną odpowiedź!");
            return;
        }

        const correct = parseInt(correctRadio.value);
        const newQ = {
            id: Date.now(),
            text: qText,
            answers: answerTexts,
            correct: correct
        };

        draftSubject.questions.push(newQ);
        Controller.clearQuestionForm(); 
        Controller.updateDraftList();
    },

    updateDraftList: () => {
        const list = document.getElementById('draft-list');
        const count = document.getElementById('q-count');
        
        if(draftSubject.questions.length === 0) {
            list.innerHTML = '<p style="padding:10px; opacity:0.7">Brak dodanych pytań.</p>';
            count.textContent = '0';
            return;
        }

        count.textContent = draftSubject.questions.length;
        list.innerHTML = draftSubject.questions.map((q, idx) => View.draftItem(q, idx)).join('');
    },

    editDraftQuestion: (index) => {
        const q = draftSubject.questions[index];
        document.getElementById('q-text').value = q.text;

        const answersWrap = document.getElementById('answers-wrap');
        answersWrap.innerHTML = '';
        q.answers.forEach((ans, i) => {
            Controller.addAnswerField(ans);
        });

        setTimeout(() => {
             const radio = document.querySelector(`input[name="correct-ans"][value="${q.correct}"]`);
             if(radio) radio.checked = true;
        }, 0);

        draftSubject.questions.splice(index, 1);
        Controller.updateDraftList();
    },

    deleteDraftQuestion: (index) => {
        draftSubject.questions.splice(index, 1);
        Controller.updateDraftList();
    },

    deleteSubject: (id) => {
        if(confirm("Czy na pewno usunąć?")) {
            deleteSubjectData(id);
            Controller.goHome();
        }
    },

    saveDatabase: () => {
        const nameInput = document.getElementById('new-subject-name').value;
        if(!nameInput) { alert("Podaj nazwę przedmiotu!"); return; }
        if(draftSubject.questions.length === 0) { alert("Dodaj chociaż jedno pytanie!"); return; }

        draftSubject.name = nameInput;
        
        // ZMIANA: Jeśli draft nie ma ID (to nowa baza), generujemy nowe.
        // Jeśli ma ID (to edycja), zostawiamy stare.
        if (!draftSubject.id) {
            draftSubject.id = "custom_" + Date.now(); 
        }

        saveNewSubject(draftSubject); // Funkcja w data.js teraz obsługuje aktualizację
        alert("Zapisano zmiany!");
        Controller.goHome();
    },

    downloadJSON: () => {
        const nameInput = document.getElementById('new-subject-name').value;
        if(draftSubject.questions.length === 0) { alert("Najpierw dodaj pytania!"); return; }
        
        draftSubject.name = nameInput || "BezNazwy";
        // Przy eksporcie generujemy ID exportowe, chyba że chcemy zachować ID
        if (!draftSubject.id) draftSubject.id = "export_" + Date.now();

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(draftSubject));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", draftSubject.name + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    loadDraftFromFile: (input) => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (!json.name || !Array.isArray(json.questions)) throw new Error("Zły plik");

                draftSubject.name = json.name;
                draftSubject.questions = json.questions;
                // Jeśli wczytujemy plik do edycji, to traktujemy go jako nową bazę lub aktualizację
                // Możemy przepisać ID z pliku jeśli chcemy nadpisać, lub wyczyścić ID żeby stworzyć kopię
                // Tutaj przyjmujemy strategię: Edycja z pliku = potencjalnie nowa baza, chyba że user ją nadpisze
                // Bezpieczniej jest wyczyścić ID, aby nie nadpisać przypadkiem innej bazy o tym samym ID (jeśli plik pochodzi od kogoś innego)
                draftSubject.id = null; 

                document.getElementById('new-subject-name').value = json.name;
                Controller.updateDraftList();
                Controller.clearQuestionForm();
                alert(`Wczytano: ${json.name}`);
            } catch (err) { alert("Błąd: " + err.message); }
        };
        reader.readAsText(file);
        input.value = '';
    },
    
    handleFileImport: (input) => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (!json.name || !Array.isArray(json.questions)) throw new Error("Zły format");
                json.id = "import_" + Date.now();
                saveNewSubject(json);
                alert("Zaimportowano!");
                Controller.goHome();
            } catch (err) { alert("Błąd: " + err.message); }
        };
        reader.readAsText(file);
        input.value = '';
    },

    openSubject: (id) => {
        const db = getDatabase();
        const subject = db.find(s => s.id === id);
        if(subject) appContainer.innerHTML = `
        <button class="theme-toggle-btn" onclick="window.app.toggleTheme()">
            ${Controller.getThemeIcon()}
        </button>` + View.subjectDetails(subject);
    },

    startQuiz: (subjectId, mode) => {
        const db = getDatabase();
        const subject = db.find(s => s.id === subjectId);
        currentSession = new QuizSession(subjectId, subject.questions, mode);
        Controller.renderCurrentQuestion();
    },

    renderCurrentQuestion: () => {
        appContainer.innerHTML = `
        <button class="theme-toggle-btn" onclick="window.app.toggleTheme()">
            ${Controller.getThemeIcon()}
        </button>` + View.question(currentSession);
    },

    handleAnswer: (index) => {
        const btns = document.querySelectorAll('.btn-answer');
        btns.forEach(b => b.disabled = true);
        const isCorrect = currentSession.submitAnswer(index);
        const q = currentSession.getCurrentQuestion();

        if (isCorrect) {
            btns[index].classList.add('btn-correct');
            markAsMastered(currentSession.subjectId, q.id);
        } else {
            btns[index].classList.add('btn-wrong');
            if(btns[q.correct]) btns[q.correct].classList.add('btn-correct');
        }

        setTimeout(() => {
            if (currentSession.next()) {
                Controller.renderCurrentQuestion();
            } else {
                appContainer.innerHTML = `
                <button class="theme-toggle-btn" onclick="window.app.toggleTheme()">
                    ${Controller.getThemeIcon()}
                </button>` + View.results(currentSession);
            }
        }, 1500);
    }
};

window.app = Controller;
Controller.init();