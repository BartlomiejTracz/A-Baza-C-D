export function getDatabase() {
    const userSubjectsJSON = localStorage.getItem('user_subjects');
    let userSubjects = userSubjectsJSON ? JSON.parse(userSubjectsJSON) : [];
    
    // Migracja: zamień stare 'correct: 0' na 'correct: [0]'
    userSubjects.forEach(s => {
        s.questions.forEach(q => {
            if (!Array.isArray(q.correct)) {
                q.correct = [q.correct];
            }
        });
    });
    
    return userSubjects;
}

export function saveNewSubject(newSubject) {
    const userSubjectsJSON = localStorage.getItem('user_subjects');
    let userSubjects = userSubjectsJSON ? JSON.parse(userSubjectsJSON) : [];

    const existingIndex = userSubjects.findIndex(s => s.id === newSubject.id);

    // Upewnij się, że poprawne odpowiedzi są tablicami przed zapisem
    newSubject.questions.forEach(q => {
        if (!Array.isArray(q.correct)) q.correct = [q.correct];
    });

    if (existingIndex !== -1) {
        userSubjects[existingIndex] = newSubject;
    } else {
        userSubjects.push(newSubject);
    }

    localStorage.setItem('user_subjects', JSON.stringify(userSubjects));
}

export function getMasteredIds(subjectId) {
    const saved = localStorage.getItem(`mastered_${subjectId}`);
    return saved ? JSON.parse(saved) : [];
}

export function markAsMastered(subjectId, questionId) {
    let mastered = getMasteredIds(subjectId);
    if (!mastered.includes(questionId)) {
        mastered.push(questionId);
        localStorage.setItem(`mastered_${subjectId}`, JSON.stringify(mastered));
    }
}

export function deleteSubject(subjectId) {
    const userSubjectsJSON = localStorage.getItem('user_subjects');
    if (!userSubjectsJSON) return;

    let userSubjects = JSON.parse(userSubjectsJSON);
    userSubjects = userSubjects.filter(s => s.id !== subjectId);

    localStorage.setItem('user_subjects', JSON.stringify(userSubjects));
    localStorage.removeItem(`mastered_${subjectId}`);
}