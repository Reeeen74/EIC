window.onload = function () {
    const resultContainer = document.getElementById("result-container");
    const scoreContainer = document.getElementById("score-container");

    // localStorageからデータを取得
    const questions = JSON.parse(localStorage.getItem("questions")) || [];
    const userAnswers = JSON.parse(localStorage.getItem("answers")) || [];

    let correctCount = 0;
    let resultHTML = "<h2>結果と解説</h2>";

    // 結果の詳細を生成
    questions.forEach((question, index) => {
        const isCorrect = userAnswers[index] === question.answer;
        if (isCorrect) correctCount++;
        resultHTML += `
            <div class="question-result">
                <p><strong>問題 ${index + 1}:</strong> ${question.question}</p>
                <p>あなたの答え: ${userAnswers[index] || "未回答"}</p>
                <p>正解: ${question.answer}</p>
                <p style="color: ${isCorrect ? "green" : "red"};">
                    ${isCorrect ? "正解" : "不正解"}
                </p>
                <p><strong>解説:</strong> ${question.explanation}</p>
                <hr>
            </div>
        `;
    });

    // 点数とコメントの表示
    const score = Math.floor((correctCount / questions.length) * 100);
    let comment = "";
    let gradeClass = "";

    if (score === 100) {
        comment = "完璧だね！素晴らしい！";
        gradeClass = "excellent";
    } else if (score >= 80) {
        comment = "とてもよくできたね！あと少し！";
        gradeClass = "great";
    } else if (score >= 60) {
        comment = "よくできました！頑張ろう！";
        gradeClass = "good";
    } else {
        comment = "次はきっと良い結果になるよ！頑張って！";
        gradeClass = "improve";
    }

    scoreContainer.innerHTML = `
        <div class="score-box ${gradeClass}">
            <h2>あなたのスコア: ${score}点</h2>
            <p>${comment}</p>
        </div>
    `;

    // 結果の詳細を挿入
    resultContainer.innerHTML = resultHTML;

    // 次の問題ボタンの処理
    document.getElementById("retry-btn").addEventListener("click", () => {
        window.location.href = "practice.html";
    });
};
