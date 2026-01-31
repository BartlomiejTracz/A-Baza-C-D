function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export class QuizSession {
    constructor(subjectId, allQuestions, mode = 40) {
        this.subjectId = subjectId;
        this.score = 0;
        this.currentIndex = 0;
        this.history = [];

        let selectedQuestions = [];
        if (mode === 'all') {
            selectedQuestions = [...allQuestions];
        } else {
            const count = typeof mode === 'number' ? mode : 40;
            selectedQuestions = shuffleArray(allQuestions).slice(0, count);
        }

        this.questions = selectedQuestions.map(q => this._scrambleAnswers(q));
    }

    _scrambleAnswers(originalQuestion) {
        // Obsługa formatu tablicowego (nowy) i liczbowego (stary import)
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

    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    submitAnswer(selectedIndices) {
        const q = this.getCurrentQuestion();
        
        // Sprawdzenie czy wybrane indeksy zgadzają się z poprawnymi
        const isCorrect = selectedIndices.length === q.correct.length && 
                          selectedIndices.every(idx => q.correct.includes(idx));

        if (isCorrect) this.score++;

        this.history.push({
            question: q,
            userSelected: selectedIndices, // Teraz tablica
            isCorrect: isCorrect
        });

        return isCorrect;
    }

    next() {
        this.currentIndex++;
        return this.currentIndex < this.questions.length;
    }
}