function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export class QuizSession {
    constructor(subjectId, allQuestions, mode = 40, masteredIds = []) {
        this.subjectId = subjectId;
        this.score = 0;
        this.currentIndex = 0;
        this.history = [];
        this.mode = mode; // <--- ZMIANA: Zapisujemy tryb, aby rozróżnić Egzamin (number) od Nauki ('all')

        // Usuwamy ewentualne duplikaty z bazy po ID
        const uniquePool = Array.from(new Map(allQuestions.map(q => [q.id, q])).values());

        let selectedQuestions = [];
        if (mode === 'all') {
            selectedQuestions = [...uniquePool]; // W trybie nauki bierzemy wszystko bez losowania
        } else {
            const count = typeof mode === 'number' ? mode : 40;
            
            // Logika unikania powtórek: dzielimy na nowe i opanowane
            const unmastered = uniquePool.filter(q => !masteredIds.includes(q.id));
            const mastered = uniquePool.filter(q => masteredIds.includes(q.id));

            // Łączymy: najpierw przetasowane nowe, potem przetasowane stare
            const combinedPool = [...shuffleArray(unmastered), ...shuffleArray(mastered)];
            selectedQuestions = combinedPool.slice(0, count);
        }

        this.questions = selectedQuestions.map(q => this._scrambleAnswers(q));
    }

    _scrambleAnswers(originalQuestion) {
        const correctIndices = Array.isArray(originalQuestion.correct) 
            ? originalQuestion.correct 
            : [originalQuestion.correct];

        const answersWithMeta = originalQuestion.answers.map((ans, index) => ({
            text: ans,
            isCorrect: correctIndices.includes(index)
        }));

        const shuffledAnswers = shuffleArray(answersWithMeta);
        const newCorrectIndices = shuffledAnswers
            .map((item, idx) => item.isCorrect ? idx : null)
            .filter(idx => idx !== null);

        return {
            ...originalQuestion,
            answers: shuffledAnswers.map(item => item.text),
            correct: newCorrectIndices
        };
    }

    getCurrentQuestion() { return this.questions[this.currentIndex]; }

    submitAnswer(selectedIndices) {
        const q = this.getCurrentQuestion();
        const isCorrect = selectedIndices.length === q.correct.length && 
                          selectedIndices.every(idx => q.correct.includes(idx));

        if (isCorrect) this.score++;
        this.history.push({ question: q, userSelected: selectedIndices, isCorrect: isCorrect });
        return isCorrect;
    }

    next() {
        this.currentIndex++;
        return this.currentIndex < this.questions.length;
    }
}