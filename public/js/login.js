// ログイン処理
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("メールアドレスとパスワードを入力してください。");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.userId); // userIdを保存
            localStorage.setItem("username", data.username);
            localStorage.setItem("currentLevel", data.level || 1);
            localStorage.setItem("currentExp", data.experience || 0);
        
            alert(`ようこそ、${data.username}さん！ レベル: ${data.level}`);
            window.location.href = "mypage.html";
        } else {
            alert(data.message || "ログインに失敗しました。");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("サーバーに接続できませんでした。もう一度お試しください。");
    }
});

// 新規登録ボタンの動作
document.getElementById("register-btn").addEventListener("click", () => {
    window.location.href = "register.html";
});

// トークンの有効性を確認する関数（オプション）
async function checkTokenValidity() {
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const response = await fetch("http://localhost:3000/verify-token", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("トークンが無効です。再ログインしてください。");
            }
            console.log("トークンは有効です。");
        } catch (error) {
            console.error("Error:", error);
            alert("セッションが切れました。再度ログインしてください。");
            localStorage.clear();
            window.location.href = "login.html";
        }
    }
}

// ページ読み込み時にトークン確認（オプション）
document.addEventListener("DOMContentLoaded", () => {
    checkTokenValidity();
});
