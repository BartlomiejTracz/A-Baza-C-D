import { getMasteredIds } from './data.js';

function escapeHTML(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export const View = {
    homeCard(subject) {
        const totalQ = subject.questions.length;
        const masteredCount = getMasteredIds(subject.id).length;
        const percent = totalQ > 0 ? Math.floor((masteredCount / totalQ) * 100) : 0;
        
        const isCustom = subject.id.toString().startsWith('custom_') || subject.id.toString().startsWith('import_');
        const safeName = escapeHTML(subject.name);
        
        let buttonsHtml = '';
        if (isCustom) {
            buttonsHtml = `
            <div style="display:flex; gap:5px;">
                <button class="btn-icon btn-edit-home" onclick="event.stopPropagation(); window.app.editSubject('${subject.id}')">✎</button>
                <button class="btn-icon btn-delete-home" onclick="event.stopPropagation(); window.app.deleteSubject('${subject.id}')">🗑</button>
            </div>`;
        }

        return `
        <div class="card card-home" onclick="window.app.openSubject('${subject.id}')">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                <h3 style="flex:1">${safeName}</h3>
                ${buttonsHtml}
            </div>
            <p>Baza: ${totalQ} pytań | Opanowano: ${percent}%</p>
            <div class="stats-bar"><div class="stats-fill" style="width: ${percent}%"></div></div>
        </div>`;
    },

   subjectDetails(subject) {
        const total = subject.questions.length;
        const defaultCount = Math.min(40, total);
        const safeName = escapeHTML(subject.name);

        return `
        <button class="btn" style="background:#6c757d" onclick="window.app.goHome()">← Wróć</button>
        <h1>${safeName}</h1>
        
        <div class="card" style="border: 2px solid #f1c40f">
            <h3 style="color:#f1c40f">📖 Przegląd Bazy</h3>
            <p>Zobacz wszystkie pytania wraz z poprawnymi odpowiedziami bez rozwiązywania testu.</p>
            <button class="btn" style="background:#f39c12; color:white;" onclick="window.app.openStudyReview('${subject.id}')">Pokaż listę pytań</button>
        </div>

        <div class="card" style="border: 2px solid #3498db">
            <h3 style="color:#3498db">Tryb Egzaminu</h3>
            <p>Losowe pytania z puli (Dostępnych: ${total})</p>
            
            <label style="display:block; margin-bottom:5px; font-weight:bold; color:#888">Ile pytań wylosować?</label>
            <div style="display:flex; gap:10px; margin-bottom:15px">
                <input type="number" id="exam-count-input" class="input-field" 
                       value="${defaultCount}" min="1" max="${total}" 
                       style="margin:0; text-align:center; font-weight:bold; font-size:18px">
            </div>

            <button class="btn" style="background:#2980b9" onclick="window.app.startCustomExam('${subject.id}')">Start Egzaminu</button> 
        </div>

        <div class="card" style="border: 2px solid #2ecc71">
            <h3 style="color:#2ecc71">Tryb Nauki (Interaktywny)</h3>
            <p>Przejdź przez całą bazę (${total} pytań) rozwiązując je po kolei.</p>
            <button class="btn" style="background:#27ae60" onclick="window.app.startQuiz('${subject.id}', 'all')">Ucz się wszystkiego</button>
        </div>`;
    },

    question(quizSession) {
        const q = quizSession.getCurrentQuestion();
        const current = quizSession.currentIndex + 1;
        const total = quizSession.questions.length;
        const isExam = typeof quizSession.mode === 'number';
        const scoreHtml = isExam ? '' : `<span>Punkty: ${quizSession.score}</span>`;

        let answersHtml = q.answers.map((ans, idx) => `
            <div class="answer-option" onclick="window.app.toggleSelection(${idx})">
                <input type="checkbox" id="ans-${idx}" class="quiz-check">
                <label style="cursor:pointer; flex:1; margin-left:10px">${escapeHTML(ans)}</label>
            </div>
        `).join('');

        return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
            <button class="theme-toggle-btn" onclick="window.app.toggleTheme()">${window.app.getThemeIcon()}</button>
            <span>Pytanie ${current}/${total}</span>
            <button class="btn" style="background:#6c757d; padding:8px 12px; font-size:14px" onclick="window.app.goHome()">Wyjdź</button>
        </div>
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px">
            ${scoreHtml}
        </div>
        <div class="card"><h3>${escapeHTML(q.text)}</h3></div>
        <div id="answers-container">${answersHtml}</div>
        <button id="submit-answer-btn" class="btn" style="background:#2ecc71; margin-top:20px" onclick="window.app.handleAnswer()" disabled>Zatwierdź odpowiedź</button>
        `;
    },

    results(quizSession) {
        const total = quizSession.questions.length;
        const percent = Math.round((quizSession.score / total) * 100);
        
        // Zamiast filtrować błędy, bierzemy całą historię
        let resultsHtml = '';

        quizSession.history.forEach(({ isCorrect, userSelected, question }, index) => {
            
            // Stylizacja kart w zależności od poprawności
            const borderColor = isCorrect ? '#2ecc71' : '#dc3545'; // zielony lub czerwony
            const resultClass = isCorrect ? 'result-correct-card' : 'result-wrong-card';
            const icon = isCorrect ? '✅' : '❌';

            const userAnsList = userSelected
                .map(i => `<li style="margin-left: 15px;">• ${escapeHTML(question.answers[i])}</li>`)
                .join('');
                
            const correctAnsList = question.correct
                .map(i => `<li style="margin-left: 15px;">• ${escapeHTML(question.answers[i])}</li>`)
                .join('');

            const userAnsDisplay = userSelected.length > 0 
                ? `<ul style="list-style: none; padding: 0; margin: 5px 0; color: ${isCorrect ? '#2ecc71' : '#e74c3c'};">${userAnsList}</ul>` 
                : '<span style="color:red">Brak odpowiedzi</span>';

            const correctAnsDisplay = `<ul style="list-style: none; padding: 0; margin: 5px 0; color: #2ecc71;">${correctAnsList}</ul>`;
            
            resultsHtml += `
            <div class="card ${resultClass}" style="border-left: 5px solid ${borderColor}; position:relative;">
                <div style="position:absolute; right:10px; top:10px; font-size:1.2em;">${icon}</div>
                <p style="margin-right:25px"><strong>${index + 1}. ${escapeHTML(question.text)}</strong></p>
                
                <div style="margin-bottom: 10px;">
                    <p style="font-size:0.9em; opacity:0.8; margin-bottom: 2px;">Twoje odpowiedzi:</p>
                    ${userAnsDisplay}
                </div>
                ${isCorrect ? '' : `
                <div style="border-top:1px solid #444; padding-top:5px">
                    <p style="font-size:0.9em; opacity:0.8; margin-bottom: 2px;">Poprawne odpowiedzi:</p>
                    ${correctAnsDisplay}
                </div>`}
            </div>`;
        });

        // Styl CSS do ukrywania poprawnych odpowiedzi
        const styleBlock = `
        <style>
            .hide-correct .result-correct-card { display: none; }
        </style>`;

        return `
        ${styleBlock}
        <h1>Wynik: ${percent}%</h1>
        <div class="card">
            Poprawne: ${quizSession.score} / ${total}
        </div>
        
        <div style="margin-bottom: 15px;">
            <button id="toggle-results-btn" class="btn" style="background:#f1c40f; color:#333; width:100%" onclick="window.app.toggleResultsView()">
                Ukryj poprawne odpowiedzi
            </button>
        </div>

        <div id="results-list">
            ${resultsHtml}
        </div>

        <div style="display:flex; gap:10px; margin-top:25px;">
            <button class="btn" style="background:#17a2b8; flex:1" onclick="window.app.restartQuiz()">🔁 Powtórz (Restart)</button>
            <button class="btn" style="flex:1" onclick="window.app.goHome()">Menu Główne</button>
        </div>
        `;
    },

    creator() {
        return `
        <button class="btn" style="background:#6c757d" onclick="window.app.goHome()">← Anuluj</button>
        <h1>Kreator Bazy</h1>
        <div class="card">
            <label>Nazwa Przedmiotu:</label>
            <input type="text" id="new-subject-name" class="input-field" placeholder="np. Farmakologia">
        </div>
        <div class="card" style="border: 2px solid #3498db">
            <h3>Edytor Pytania</h3>
            <label>Treść pytania:</label>
            <input type="text" id="q-text" class="input-field" placeholder="Wpisz treść...">
            <label>Odpowiedzi (zaznacz wszystkie poprawne):</label>
            <div id="answers-wrap"></div>
            <button class="btn" style="background:#17a2b8; padding:10px" onclick="window.app.addAnswerField()">+ Dodaj kolejną odpowiedź</button>
            <hr>
            <button class="btn" style="background:#2ecc71" onclick="window.app.saveQuestionToDraft()">Zatwierdź Pytanie</button>
        </div>
        <div class="card">
            <h3>Lista pytań (<span id="q-count">0</span>)</h3>
            <div id="draft-list"></div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom: 20px;">
            <button class="btn" style="flex:1" onclick="window.app.saveDatabase()">💾 ZAPISZ</button>
            <button class="btn" style="background:#f1c40f; color:#333; flex:1" onclick="window.app.downloadJSON()">⬇ POBIERZ</button>
            <input type="file" id="draft-file-input" accept=".json" style="display:none" onchange="window.app.loadDraftFromFile(this)">
            <button class="btn" style="background:#17a2b8; flex:1" onclick="document.getElementById('draft-file-input').click()">📂 WCZYTAJ</button>
        </div>`;
    },

    answerInput(index, value = "", isChecked = false) {
        return `
        <div class="answer-row" id="ans-row-${index}" style="display:flex; align-items:center; margin-bottom:5px">
            <input type="checkbox" name="correct-ans" value="${index}" ${isChecked ? 'checked' : ''}>
            <input type="text" class="input-field answer-text" data-idx="${index}" value="${escapeHTML(value)}" placeholder="Odp ${index + 1}" style="margin:0">
            <button onclick="window.app.removeAnswerField(${index})" style="background:none; border:none; color:red; font-size:20px; margin-left:5px">×</button>
        </div>`;
    },

    draftItem(question, index) {
        const safeText = escapeHTML(question.text);
        const correctAnswers = question.correct.map(i => escapeHTML(question.answers[i])).join(', ');
        
        return `
        <div class="card" style="padding:10px; cursor: default; transform: none !important;">
            <div style="font-weight:bold; margin-bottom:5px">${index + 1}. ${safeText}</div>
            <div style="font-size:0.9em;">
                Poprawne: <strong class="correct-answer">${correctAnswers}</strong>
            </div>
            <div style="margin-top:10px; display:flex; gap:10px">
                <button class="btn-edit" onclick="window.app.editDraftQuestion(${index})">Edytuj</button>
                <button class="btn-delete" onclick="window.app.deleteDraftQuestion(${index})">Usuń</button>
            </div>
        </div>`;
    },

    studyList(subject) {
        const listHtml = subject.questions.map((q, index) => {
            const safeText = escapeHTML(q.text);
            const answersHtml = q.answers.map((ans, aIdx) => {
                const isCorrect = q.correct.includes(aIdx);
                const style = isCorrect 
                    ? 'border: 1px solid #2ecc71; color:#2ecc71; font-weight:bold; background:rgba(46, 204, 113, 0.1); border-radius:4px; padding:4px 8px; margin-bottom: 5px; display:block;' 
                    : 'border: 1px solid transparent; color: inherit; opacity: 0.7; padding:4px 8px; margin-bottom: 5px; display:block;';
                return `<div style="${style}"><span style="margin-right:8px">${isCorrect ? '✅' : '⚪'}</span> ${escapeHTML(ans)}</div>`;
            }).join('');

            return `
            <div class="card" style="border-left: 5px solid #2ecc71;">
                <h3 style="margin-top:0; margin-bottom:10px; color:#3d8cd6; font-size: 0.9em; text-transform:uppercase; letter-spacing:1px;">Pytanie ${index + 1}</h3>
                <p style="font-size:1.1em; font-weight:500; margin-bottom:15px; margin-top:0;">${safeText}</p>
                <div style="border-top:1px solid #444; padding-top:10px; margin-top:10px;">${answersHtml}</div>
            </div>`;
        }).join('');

        return `
        <div class="sticky-header">
            <button class="btn back-btn-top" onclick="window.app.openSubject('${subject.id}')">
                ← Wróć
            </button>
            <button class="theme-toggle-btn sticky-theme" onclick="window.app.toggleTheme()">
                ${window.app.getThemeIcon()}
            </button>
        </div>

        <div style="margin: 20px 0; padding-top: 10px;">
            <h2 style="margin:0; font-size: 1.5em;">Przegląd Bazy</h2>
            <p style="margin:5px 0; opacity:0.8;">${escapeHTML(subject.name)}</p>
        </div>

        <div style="padding-bottom:50px">
            ${listHtml}
        </div>
        `;
    }
};