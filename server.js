const path = require('path');
const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// アプリケーション設定
const app = express();
const PORT = 3000;
const SECRET_KEY = "renren1274"; // JWT用の秘密キー

// ミドルウェア
app.use(express.json()); // JSONリクエストの処理
app.use(cors()); // CORSを許可

app.use(express.static(path.join(__dirname, 'public')));

// MySQLデータベース接続設定
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'renren1274',
    database: 'learning_app',
    waitForConnections: true,
    connectionLimit: 10
});


// データベース接続確認
db.connect(err => {
    if (err) {
        console.error("データベース接続エラー:", err);
        process.exit(1);
    }
    console.log("MySQL Connected...");
});

// ユーザー登録API
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "すべての項目を入力してください。" });
    }

    try {
        // パスワードをハッシュ化
        const hashedPassword = await bcrypt.hash(password, 10);

        // データベースにユーザーを追加
        const query = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
        db.execute(query, [username, email, hashedPassword], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "登録に失敗しました。メールアドレスは既に使われています。" });
            }
            res.status(201).json({ message: "登録が成功しました！" });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "サーバーエラーが発生しました。" });
    }
});

// ユーザーログインAPI
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "メールアドレスとパスワードを入力してください。" });
    }

    // データベースからユーザー情報を取得
    const query = "SELECT * FROM users WHERE email = ?";
    db.execute(query, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ message: "メールアドレスまたはパスワードが違います。" });
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "メールアドレスまたはパスワードが違います。" });
        }

        // JWTトークン生成
        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({
            message: "ログイン成功！",
            userId: user.id,
            username: user.username,
            level: user.level || 1,
            experience: user.experience || 0,
            token: token
        });
    });
});

app.get("/verify-token", (req, res) => {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "トークンがありません。" });
    }

    try {
        const decoded = jwt.verify(token, "YOUR_SECRET_KEY");
        res.status(200).json({ message: "トークンは有効です。", userId: decoded.userId });
    } catch (error) {
        res.status(401).json({ message: "トークンが無効または期限切れです。" });
    }
});

app.get("/user/:id", (req, res) => {
    const userId = req.params.id;

    const query = "SELECT level, experience FROM users WHERE id = ?";
    db.execute(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "データベースエラー" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "ユーザーが見つかりません。" });
        }
        const user = results[0];
        const nextLevelExp = user.level * 10;
        res.json({ level: user.level, experience: user.experience, nextLevelExp });
    });
});

// 過去問題の履歴を取得するAPI
app.get("/user/:id/history", (req, res) => {
    const userId = req.params.id;

    console.log("Fetching history for userId:", userId);

    const query = "SELECT questions FROM user_history WHERE user_id = ?";
    db.execute(query, [userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "履歴データの取得中にエラーが発生しました。" });
        }

        if (results.length === 0) {
            console.log("No history found for user:", userId);
            return res.status(404).json({ message: "履歴データが存在しません。" });
        }

        try {
            console.log("Raw data from DB:", results);
            
            // すでにオブジェクトとして返されているので、そのまま返却
            const history = results.map((row) => row.questions);
            res.json(history.flat()); // 配列をフラット化して返す
        } catch (parseError) {
            console.error("Data processing error:", parseError);
            res.status(500).json({ message: "履歴データの処理中にエラーが発生しました。" });
        }
    });
});





// ユーザーデータ（経験値・レベル）を更新するAPI
app.post("/user/update", (req, res) => {
    const { userId, level, experience } = req.body;

    const query = "UPDATE users SET level = ?, experience = ? WHERE id = ?";
    db.execute(query, [level, experience, userId], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "ユーザーデータの更新に失敗しました。" });
        }
        res.json({ message: "ユーザーデータが更新されました。" });
    });
});


app.post("/user/levelup", (req, res) => {
    const { userId, level, experience } = req.body;

    console.log("Received for update:", { userId, level, experience });

    if (!userId || level === undefined || experience === undefined) {
        return res.status(400).json({ message: "入力データが不正です。" });
    }

    const query = "UPDATE users SET level = ?, experience = ? WHERE id = ?";
    db.execute(query, [level, experience, userId], err => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "データ更新に失敗しました。" });
        }
        res.json({ message: "レベルと経験値が更新されました。" });
    });
});

// ユーザーヒストリーの保存API
app.post("/user/:id/history", (req, res) => {
    const userId = req.params.id;
    const { questions } = req.body;

    console.log("Received data to save:", { userId, questions });

    if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "履歴データが不足しています。" });
    }

    // 既存の履歴があるか確認
    const checkQuery = "SELECT COUNT(*) AS count FROM user_history WHERE user_id = ? AND questions = ?";
    db.execute(checkQuery, [userId, JSON.stringify(questions)], (checkErr, results) => {
        if (checkErr) {
            console.error("Error checking history:", checkErr);
            return res.status(500).json({ message: "履歴確認中にエラーが発生しました。" });
        }

        if (results[0].count > 0) {
            return res.status(200).json({ message: "同じ履歴データが既に存在しています。" });
        }

        // 履歴を新規保存
        const insertQuery = "INSERT INTO user_history (user_id, questions) VALUES (?, ?)";
        db.execute(insertQuery, [userId, JSON.stringify(questions)], (err) => {
            if (err) {
                console.error("Error saving history:", err);
                return res.status(500).json({ message: "履歴の保存に失敗しました。" });
            }
            res.status(201).json({ message: "履歴が保存されました。" });
        });
    });
});

// ユーザーの経験値とレベルを更新
app.post("/user/:id/exp", (req, res) => {
    const userId = req.params.id;
    const { experienceGained } = req.body; // 獲得した経験値

    if (!experienceGained) {
        return res.status(400).json({ message: "経験値が不足しています。" });
    }

    // 現在の経験値とレベルを取得
    const selectQuery = "SELECT level, experience FROM users WHERE id = ?";
    db.execute(selectQuery, [userId], (err, results) => {
        if (err || results.length === 0) {
            console.error("Error fetching user data:", err);
            return res.status(500).json({ message: "ユーザーデータの取得に失敗しました。" });
        }

        let { level, experience } = results[0];
        experience += experienceGained;
        const nextLevelExp = level * 10;

        // レベルアップの判定
        if (experience >= nextLevelExp) {
            level += 1;
            experience -= nextLevelExp;
        }

        // データベースを更新
        const updateQuery = "UPDATE users SET level = ?, experience = ? WHERE id = ?";
        db.execute(updateQuery, [level, experience, userId], (updateErr) => {
            if (updateErr) {
                console.error("Error updating user data:", updateErr);
                return res.status(500).json({ message: "経験値の更新に失敗しました。" });
            }
            res.json({ level, experience, nextLevelExp: level * 10 });
        });
    });
});






// サーバー起動
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});