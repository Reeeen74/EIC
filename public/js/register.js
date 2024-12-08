document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // 入力値を取得
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // サーバーへPOSTリクエストを送信
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("登録が成功しました！ログイン画面に移動します。");
            window.location.href = "login.html"; // 成功時にログインページへ遷移
        } else {
            alert(`エラー: ${data.message}`);
        }
    } catch (error) {
        console.error("エラー:", error);
        alert("サーバーに接続できませんでした。再試行してください。");
    }
});
