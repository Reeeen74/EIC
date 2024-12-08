document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("userId");

    // userIdが存在しない場合、ログインページにリダイレクト
    if (!userId) {
        alert("ログインが必要です。");
        window.location.href = "login.html";
        return;
    }

    // データを読み込む
    loadHeader().then(() => {
        loadUserData(userId);
        loadUserHistory(userId);
    });
});

// ヘッダーを読み込む関数
async function loadHeader() {
    try {
        const response = await fetch('header.html');
        if (!response.ok) {
            throw new Error('ヘッダーの読み込みに失敗しました。');
        }
        const headerHTML = await response.text();
        document.getElementById('header-container').innerHTML = headerHTML;
    } catch (error) {
        console.error(error.message);
    }
}

// ユーザーデータの読み込み
async function loadUserData() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        console.error("ユーザーIDが存在しません。");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/user/${userId}`);
        if (!response.ok) throw new Error("ユーザーデータの取得に失敗しました。");

        const data = await response.json();

        // データを反映
        const currentLevel = data.level;
        const currentExp = data.experience;
        const nextLevelExp = currentLevel * 10;

        document.getElementById("current-level").textContent = currentLevel;
        document.getElementById("current-exp").textContent = currentExp;
        document.getElementById("exp-to-next").textContent = nextLevelExp - currentExp;

        // 経験値バー
        const expPercentage = (currentExp / nextLevelExp) * 100;
        document.getElementById("exp-bar").style.width = `${expPercentage}%`;
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}


// 過去20問の履歴表示
async function loadUserHistory() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        console.error("ユーザーIDが存在しません。");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/user/${userId}/history`);
        if (!response.ok) throw new Error("履歴データの取得に失敗しました。");

        const history = await response.json(); // サーバーからの履歴データ
        const historyContainer = document.getElementById("question-history");

        // 最新の10件のみを表示
        const latestHistory = history.slice(-10).reverse(); // 最新10件を取得し、並び順を逆に

        historyContainer.innerHTML = latestHistory.map((item, index) => `
            <li>
                ${index + 1}. ${item.question} - 
                ${item.isCorrect ? '<span style="color: green;">正解</span>' : '<span style="color: red;">不正解</span>'}
            </li>
        `).join("");

    } catch (error) {
        console.error("Error loading user history:", error);
        document.getElementById("question-history").innerHTML = "<p>履歴データの取得に失敗しました。</p>";
    }
}


// 傾向分析
async function loadUserAnalysis() {
    const userId = localStorage.getItem("userId");

    try {
        const response = await fetch(`http://localhost:3000/user/${userId}/history`);
        if (!response.ok) throw new Error("履歴データの取得に失敗しました。");

        const history = await response.json();

        const typeStats = {};
        history.forEach((item) => {
            const type = item.type || "不明";
            const isCorrect = item.isCorrect;

            if (!typeStats[type]) {
                typeStats[type] = { correct: 0, total: 0 };
            }
            typeStats[type].total += 1;
            if (isCorrect) typeStats[type].correct += 1;
        });

        let weakArea = "不明", strongArea = "不明";
        let maxAccuracy = 0, minAccuracy = 1;

        for (const type in typeStats) {
            const accuracy = typeStats[type].correct / typeStats[type].total;
            if (accuracy > maxAccuracy) {
                maxAccuracy = accuracy;
                strongArea = type;
            }
            if (accuracy < minAccuracy) {
                minAccuracy = accuracy;
                weakArea = type;
            }
        }

        // データを表示
        document.getElementById("strong-area").textContent = strongArea;
        document.getElementById("weak-area").textContent = weakArea;
    } catch (error) {
        console.error("Error loading user analysis:", error);
    }
}
