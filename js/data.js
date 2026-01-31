export function getDatabase() {
    const userSubjectsJSON = localStorage.getItem('user_subjects');
    const userSubjects = userSubjectsJSON ? JSON.parse(userSubjectsJSON) : [];

    return userSubjects;
}

export function saveNewSubject(newSubject) {
    const userSubjectsJSON = localStorage.getItem('user_subjects');
    let userSubjects = userSubjectsJSON ? JSON.parse(userSubjectsJSON) : [];

    userSubjects.push(newSubject);

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