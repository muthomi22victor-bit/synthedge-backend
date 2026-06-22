const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// ============ SIMPLE JSON DATABASE ============
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        users: [],
        balances: [],
        achievements: [],
        payouts: [],
        leaderboard: [],
        journal: [],
        certificates: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Read database
function readDB() {
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
}

// Write database
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    next();
});

// ============ AUTH MIDDLEWARE ============
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    jwt.verify(token, 'secretkey123', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// ============ TEST ROUTE ============
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// ============ REGISTER ============
app.post('/api/register', async (req, res) => {
    console.log('📝 Registration request received');
    console.log('Body:', req.body);
    
    try {
        const { username, email, password } = req.body;
        
        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Read database
        const db = readDB();
        
        // Check if user exists
        const existingUser = db.users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            rank: 'Junior Trader',
            createdAt: new Date().toISOString()
        };
        
        db.users.push(newUser);
        
        // Create default balance
        db.balances.push({
            userId: newUser.id,
            balance: 10000,
            equity: 10200,
            drawdown: 2.5,
            profit: 200,
            challenge: '10000'
        });
        
        // Add to leaderboard
        db.leaderboard.push({
            userId: newUser.id,
            username: newUser.username,
            profit: 0,
            rank: db.leaderboard.length + 1
        });
        
        // Save to database
        writeDB(db);
        
        console.log('✅ User created:', username);
        res.status(201).json({ 
            message: 'User created successfully',
            user: { username, email }
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ LOGIN ============
app.post('/api/login', async (req, res) => {
    console.log('🔐 Login request received');
    
    try {
        const { username, password } = req.body;
        const db = readDB();
        
        const user = db.users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username },
            'secretkey123',
            { expiresIn: '24h' }
        );
        
        console.log('✅ Login successful:', username);
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                rank: user.rank
            }
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ GET CURRENT USER ============
app.get('/api/me', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const user = db.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            rank: user.rank
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ GET BALANCE ============
app.get('/api/balance', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const balance = db.balances.find(b => b.userId === req.user.id);
        if (!balance) return res.status(404).json({ error: 'Balance not found' });
        res.json(balance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ UPDATE BALANCE ============
app.put('/api/balance', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { balance, equity, drawdown, profit } = req.body;
        const index = db.balances.findIndex(b => b.userId === req.user.id);
        if (index !== -1) {
            db.balances[index] = { ...db.balances[index], balance, equity, drawdown, profit };
            writeDB(db);
        }
        res.json({ message: 'Balance updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ GET ACHIEVEMENTS ============
app.get('/api/achievements', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const achievements = db.achievements.filter(a => a.userId === req.user.id);
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ADD ACHIEVEMENT ============
app.post('/api/achievements', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { name } = req.body;
        const achievement = {
            id: Date.now().toString(),
            userId: req.user.id,
            name,
            earnedAt: new Date().toISOString()
        };
        db.achievements.push(achievement);
        writeDB(db);
        res.json(achievement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ GET PAYOUTS ============
app.get('/api/payouts', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const payouts = db.payouts.filter(p => p.userId === req.user.id);
        res.json(payouts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ADD PAYOUT ============
app.post('/api/payouts', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { amount, date, status } = req.body;
        const payout = {
            id: Date.now().toString(),
            userId: req.user.id,
            amount,
            date: date || new Date().toISOString().split('T')[0],
            status: status || 'Pending'
        };
        db.payouts.push(payout);
        writeDB(db);
        res.json(payout);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ GET JOURNAL ============
app.get('/api/journal', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const entries = db.journal.filter(j => j.userId === req.user.id);
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ADD JOURNAL ENTRY ============
app.post('/api/journal', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { entry, outcome, date } = req.body;
        const journalEntry = {
            id: Date.now().toString(),
            userId: req.user.id,
            entry,
            outcome: outcome || 'pending',
            date: date || new Date().toISOString().split('T')[0]
        };
        db.journal.push(journalEntry);
        writeDB(db);
        res.json(journalEntry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ GET CERTIFICATES ============
app.get('/api/certificates', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const certs = db.certificates.filter(c => c.userId === req.user.id);
        res.json(certs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ADD CERTIFICATE ============
app.post('/api/certificates', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { name } = req.body;
        const cert = {
            id: Date.now().toString(),
            userId: req.user.id,
            name,
            earnedAt: new Date().toISOString()
        };
        db.certificates.push(cert);
        writeDB(db);
        res.json(cert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ GET LEADERBOARD ============
app.get('/api/leaderboard', (req, res) => {
    try {
        const db = readDB();
        const leaderboard = [...db.leaderboard].sort((a, b) => b.profit - a.profit);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ UPDATE LEADERBOARD ============
app.post('/api/leaderboard', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { profit } = req.body;
        const existing = db.leaderboard.find(l => l.userId === req.user.id);
        
        if (existing) {
            existing.profit = profit;
        } else {
            db.leaderboard.push({
                userId: req.user.id,
                username: req.user.username,
                profit
            });
        }
        
        // Recalculate ranks
        const sorted = [...db.leaderboard].sort((a, b) => b.profit - a.profit);
        sorted.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        
        writeDB(db);
        res.json({ message: 'Leaderboard updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ START CHALLENGE ============
app.post('/api/challenge/start', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { amount } = req.body;
        const challenges = {
            '10000': { balance: 10000, target: 10800 },
            '25000': { balance: 25000, target: 27000 },
            '50000': { balance: 50000, target: 54000 },
            '100000': { balance: 100000, target: 108000 }
        };
        
        const challenge = challenges[amount];
        if (!challenge) {
            return res.status(400).json({ error: 'Invalid challenge amount' });
        }
        
        const index = db.balances.findIndex(b => b.userId === req.user.id);
        if (index !== -1) {
            db.balances[index] = {
                ...db.balances[index],
                balance: challenge.balance,
                equity: challenge.balance,
                drawdown: 0,
                profit: 0,
                challenge: amount,
                target: challenge.target
            };
            writeDB(db);
        }
        
        res.json({ 
            message: `Challenge ${amount} started!`,
            challenge: { amount, ...challenge }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ START SERVER ============
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SynthEdge Backend running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_FILE}`);
    console.log(`📨 Ready to accept requests!`);
});