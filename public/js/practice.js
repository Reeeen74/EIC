let selectedQuestions = [];
let userAnswers = [];

// JSONファイルから問題を取得し、選択肢をシャッフル
async function loadQuestions() {
    try {
        const response = await fetch("practice.json");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let questions = await response.json();

        // 各問題の選択肢をシャッフル
        questions = questions.map(question => ({
            ...question,
            options: shuffleArray([...question.options])
        }));

        selectedQuestions = shuffleArray(questions).slice(0, 5);
        displayQuestions(selectedQuestions);
    } catch (error) {
        console.error("Error loading questions:", error);
        document.getElementById("question-container").innerHTML = "<p>問題の読み込みに失敗しました。</p>";
    }
}

// シャッフル関数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// HTMLに問題を表示する
function displayQuestions(questions) {
    const container = document.getElementById("question-container");
    container.innerHTML = "";
    questions.forEach((question, index) => {
        const html = `
            <div class="question-box">
                <p><strong>問題 ${index + 1}:</strong> ${question.question}</p>
                <ul>
                    ${question.options.map((option, i) => `
                        <li>
                            <input type="radio" name="q${index}" id="q${index}_opt${i}" value="${option}">
                            <label for="q${index}_opt${i}">${option}</label>
                        </li>`).join("")}
                </ul>
            </div>
        `;
        container.innerHTML += html;
    });
}

// 答えを送信
async function submitAnswers() {
    userAnswers = [];
    let correctAnswers = 0;
    const explanations = []; // 解説データを格納

    selectedQuestions.forEach((question, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        const isCorrect = selected && selected.value === question.answer;
        
        // 解説を保存
        explanations.push({
            question: question.question,
            selected: selected ? selected.value : "未回答",
            correct: question.answer,
            explanation: question.explanation,
            isCorrect: isCorrect
        });

        if (isCorrect) correctAnswers += 1;
        userAnswers.push(selected ? selected.value : null);
    });
    localStorage.removeItem("explanations"); // 古いデータを削除
    localStorage.removeItem("score"); // 古いスコアを削除

    localStorage.setItem("questions", JSON.stringify(selectedQuestions));
    localStorage.setItem("answers", JSON.stringify(userAnswers));
    localStorage.setItem("explanations", JSON.stringify(explanations));
    localStorage.setItem("score", correctAnswers);

    const currentExp = parseInt(localStorage.getItem("currentExp") || "0");
    const currentLevel = parseInt(localStorage.getItem("currentLevel") || "1");
    const nextLevelExp = currentLevel * 10;

    let newExp = currentExp + correctAnswers;
    if (newExp >= nextLevelExp) {
        localStorage.setItem("currentExp", newExp - nextLevelExp);
        localStorage.setItem("currentLevel", currentLevel + 1);
        window.location.href = "levelup.html";
    } else {
        localStorage.setItem("currentExp", newExp);
        window.location.href = "result.html";
    }

    // 履歴データを保存
    const userId = localStorage.getItem("userId");
    try {
        await fetch(`http://localhost:3000/user/${userId}/exp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ experienceGained: correctAnswers })
        });
    } catch (error) {
        console.error("Error updating experience:", error);
    }
    const historyData = selectedQuestions.map((question, index) => ({
        question: question.question,
        isCorrect: question.answer === userAnswers[index]
    }));
    
    console.log("Sending history data:", historyData); // デバッグ用ログ
    
    try {
        const response = await fetch(`http://localhost:3000/user/${userId}/history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questions: historyData }) // 確実にJSON文字列化
        });
        if (!response.ok) {
            throw new Error("履歴データの保存に失敗しました。");
        }
        console.log("履歴データが保存されました。");
    } catch (error) {
        console.error("履歴データの保存中にエラー:", error);
    }

    localStorage.setItem("questions", JSON.stringify(selectedQuestions));
    localStorage.setItem("answers", JSON.stringify(userAnswers));
    localStorage.setItem("explanations", JSON.stringify(explanations));
    localStorage.setItem("score", correctAnswers); // 点数を保存
}


// イベントリスナー
document.getElementById("submit-btn").addEventListener("click", submitAnswers);

// 初期化
loadQuestions();
