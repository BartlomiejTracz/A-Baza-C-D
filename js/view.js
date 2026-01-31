import { getMasteredIds } from './data.js';

// --- FUNKCJA ZABEZPIECZAJĄCA ---
// Zamienia znaki specjalne na tekst, żeby przeglądarka nie traktowała ich jak kodu
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
        // Zabezpieczamy nazwę przedmiotu
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
        
        <div class="card" style="border: 2px solid #3498db">
            <h3>Tryb Egzaminu</h3>
            <p>Losowe pytania z puli (Dostępnych: ${total})</p>
            
            <label style="display:block; margin-bottom:5px; font-weight:bold; color:#555">Ile pytań wylosować?</label>
            <div style="display:flex; gap:10px; margin-bottom:15px">
                <input type="number" id="exam-count-input" class="input-field" 
                       value="${defaultCount}" min="1" max="${total}" 
                       style="margin:0; text-align:center; font-weight:bold; font-size:18px">
            </div>

            <button class="btn" onclick="window.app.startCustomExam('${subject.id}')">Start Egzaminu</button> 
        </div>

        <div class="card">
            <h3>Tryb Nauki</h3>
            <p>Przejdź przez całą bazę (${total} pytań) bez losowania.</p>
            <button class="btn" style="background:#17a2b8" onclick="window.app.startQuiz('${subject.id}', 'all')">Ucz się wszystkiego</button>
        </div>`;
    },

    question(quizSession) {
        const q = quizSession.getCurrentQuestion();
        const current = quizSession.currentIndex + 1;
        const total = quizSession.questions.length;

        const isMulti = q.correct.length > 1;

        // Zabezpieczamy treść odpowiedzi i treść pytania
        let answersHtml = q.answers.map((ans, idx) => `
            <div class="answer-option" onclick="window.app.toggleSelection(${idx})">
                <input type="checkbox" id="ans-${idx}" class="quiz-check">
                <label style="cursor:pointer; flex:1; margin-left:10px">${escapeHTML(ans)}</label>
            </div>
        `).join('');

        return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
            <button class="theme-toggle-btn" onclick="window.app.toggleTheme()">${window.app.getThemeIcon()}</button>
            <span>Pytanie ${current}/${total} ${isMulti ? '(Wielokrotny wybór)' : ''}</span>
            <button class="btn" style="background:#6c757d; padding:8px 12px; font-size:14px" onclick="window.app.goHome()">Wyjdź</button>
        </div>
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px">
            <span>Punkty: ${quizSession.score}</span>
        </div>
        <div class="card"><h3>${escapeHTML(q.text)}</h3></div>
        <div id="answers-container">${answersHtml}</div>
        <button class="btn" style="background:#2ecc71; margin-top:20px" onclick="window.app.handleAnswer()">Zatwierdź odpowiedź</button>
        `;
    },

    results(quizSession) {
        const total = quizSession.questions.length;
        const percent = Math.round((quizSession.score / total) * 100);
        const errors = quizSession.history.filter(h => !h.isCorrect);
        let errorsHtml = errors.length > 0 ? '<h3>Błędy:</h3>' : '<h3 style="color:green">Brak błędów!</h3>';

        errors.forEach(item => {
            // Tutaj też escapeHTML, bo podsumowanie też może się rozsypać
            const userAns = item.userSelected.map(i => escapeHTML(item.question.answers[i])).join(', ') || "Brak";
            const correctAns = item.question.correct.map(i => escapeHTML(item.question.answers[i])).join(', ');
            
            errorsHtml += `
            <div class="card" style="border-left: 5px solid #dc3545">
                <p><strong>${escapeHTML(item.question.text)}</strong></p>
                <p style="color:red">Twoje: ${userAns}</p>
                <p style="color:green">Poprawne: ${correctAns}</p>
            </div>`;
        });

        return `
        <h1>Wynik: ${percent}%</h1>
        <div class="card">Poprawne: ${quizSession.score} / ${total}</div>
        ${errorsHtml}
        <button class="btn" onclick="window.app.goHome()">Menu Główne</button>
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
        // Tu jest WAŻNE: value="..." musi mieć escape, bo inaczej cudzysłów w tekście zepsuje HTML inputa
        return `
        <div class="answer-row" id="ans-row-${index}" style="display:flex; align-items:center; margin-bottom:5px">
            <input type="checkbox" name="correct-ans" value="${index}" ${isChecked ? 'checked' : ''}>
            <input type="text" class="input-field answer-text" data-idx="${index}" value="${escapeHTML(value)}" placeholder="Odp ${index + 1}" style="margin:0">
            <button onclick="window.app.removeAnswerField(${index})" style="background:none; border:none; color:red; font-size:20px; margin-left:5px">×</button>
        </div>`;
    },

    draftItem(question, index) {
        // Zabezpieczamy listę w kreatorze - to tu psuły się kolejne pytania
        const safeText = escapeHTML(question.text);
        const correctAnswers = question.correct.map(i => escapeHTML(question.answers[i])).join(', ');
        
        return `
        <div class="card draft-item" style="padding:10px;">
            <div style="font-weight:bold; margin-bottom:5px">${index + 1}. ${safeText}</div>
            <div style="font-size:0.9em;">
                Poprawne: <strong class="correct-answer">${correctAnswers}</strong>
            </div>
            <div style="margin-top:10px; display:flex; gap:10px">
                <button class="btn-edit" onclick="window.app.editDraftQuestion(${index})">Edytuj</button>
                <button class="btn-delete" onclick="window.app.deleteDraftQuestion(${index})">Usuń</button>
            </div>
        </div>`;
    }
};