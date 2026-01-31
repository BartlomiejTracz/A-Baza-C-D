import { getMasteredIds } from './data.js';

export const View = {
    homeCard(subject) {
        const totalQ = subject.questions.length;
        const masteredCount = getMasteredIds(subject.id).length;
        const percent = totalQ > 0 ? Math.floor((masteredCount / totalQ) * 100) : 0;
        
        const isCustom = subject.id.toString().startsWith('custom_') || subject.id.toString().startsWith('import_');
        
        
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
                <h3 style="flex:1">${subject.name}</h3>
                ${buttonsHtml}
            </div>
            <p>Baza: ${totalQ} pytań | Opanowano: ${percent}%</p>
            <div class="stats-bar"><div class="stats-fill" style="width: ${percent}%"></div></div>
        </div>`;
    },

    subjectDetails(subject) {
        return `
        <button class="btn" style="background:#6c757d" onclick="window.app.goHome()">← Wróć</button>
        <h1>${subject.name}</h1>
        <div class="card">
            <h3>Tryb Egzaminu</h3>
            <button class="btn" onclick="window.app.startQuiz('${subject.id}', 3)">Start (Losowe 3)</button> 
        </div>
        <div class="card">
            <h3>Tryb Nauki</h3>
            <button class="btn" onclick="window.app.startQuiz('${subject.id}', 'all')">Ucz się wszystkiego</button>
        </div>`;
    },

    question(quizSession) {
        const q = quizSession.getCurrentQuestion();
        const current = quizSession.currentIndex + 1;
        const total = quizSession.questions.length;

        let answersHtml = q.answers.map((ans, idx) => 
            `<button class="btn btn-answer" onclick="window.app.handleAnswer(${idx})">${ans}</button>`
        ).join('');

        return `
        <div style="display:flex; justify-content:space-between">
            <span>Pytanie ${current}/${total}</span>
            <span>Punkty: ${quizSession.score}</span>
        </div>
        <div class="card"><h3>${q.text}</h3></div>
        <div id="answers-container">${answersHtml}</div>
        `;
    },

    results(quizSession) {
        const total = quizSession.questions.length;
        const percent = Math.round((quizSession.score / total) * 100);
        
        const errors = quizSession.history.filter(h => !h.isCorrect);
        let errorsHtml = errors.length > 0 ? '<h3>Błędy:</h3>' : '<h3 style="color:green">Brak błędów!</h3>';

        errors.forEach(item => {
            errorsHtml += `
            <div class="card" style="border-left: 5px solid #dc3545">
                <p><strong>${item.question.text}</strong></p>
                <p style="color:red">Ty: ${item.question.answers[item.userSelected]}</p>
                <p style="color:green">Dobrze: ${item.question.answers[item.question.correct]}</p>
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
            
            <label>Odpowiedzi (zaznacz poprawną):</label>
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
            <button class="btn" style="flex:1; min-width:200px" onclick="window.app.saveDatabase()">💾 ZAPISZ DO APLIKACJI</button>
            
            <button class="btn" style="background:#f1c40f; color:#333; flex:1" onclick="window.app.downloadJSON()">⬇ POBIERZ PLIK</button>
            
            <input type="file" id="draft-file-input" accept=".json" style="display:none" onchange="window.app.loadDraftFromFile(this)">
            <button class="btn" style="background:#17a2b8; color:white; flex:1" onclick="document.getElementById('draft-file-input').click()">📂 WCZYTAJ DO EDYCJI</button>
        </div>
        `;
    },

    answerInput(index, value = "") {
        return `
        <div class="answer-row" id="ans-row-${index}" style="display:flex; align-items:center; margin-bottom:5px">
            <input type="radio" name="correct-ans" value="${index}">
            <input type="text" class="input-field answer-text" data-idx="${index}" value="${value}" placeholder="Odp ${index + 1}" style="margin:0">
            <button onclick="window.app.removeAnswerField(${index})" style="background:none; border:none; color:red; font-size:20px; margin-left:5px">×</button>
        </div>`;
    },

    draftItem(question, index) {
        return `
        <div class="card draft-item" style="padding:10px;">
            <div style="font-weight:bold; margin-bottom:5px">${index + 1}. ${question.text}</div>
            <div style="font-size:0.9em;">
                Odp: ${question.answers.join(', ')} <br>
                Poprawna: <strong class="correct-answer">${question.answers[question.correct]}</strong>
            </div>
            <div style="margin-top:10px; display:flex; gap:10px">
                <button class="btn-edit" onclick="window.app.editDraftQuestion(${index})">Edytuj</button>
                <button class="btn-delete" onclick="window.app.deleteDraftQuestion(${index})">Usuń</button>
            </div>
        </div>`;
    }
};