const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

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
        certificates: [],
        trades: [],
        positions: []
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

// ============ SEED FAKE USERS ============
function seedFakeUsers() {
    const db = readDB();
    
    // Check if fake users already exist
    const existingFakeUsers = db.users.filter(u => 
        u.username === 'Maina Gatheru' || 
        u.username === 'M0N3Y sn1p3r' || 
        u.username === 'Courtney Wachira'
    );
    
    if (existingFakeUsers.length > 0) {
        console.log('✅ Fake users already exist');
        return;
    }
    
    console.log('🌱 Seeding fake users...');
    
    const fakeUsers = [
        { 
            username: 'Maina Gatheru', 
            email: 'maina@synth.com', 
            rank: 'Elite Trader', 
            balance: 187450, 
            equity: 215567, 
            profit: 28117, 
            drawdown: 1.8,
            payouts: [8500, 6200, 4800, 3200],
            trades: 156,
            wins: 112
        },
        { 
            username: 'M0N3Y sn1p3r', 
            email: 'money@synth.com', 
            rank: 'Pro Trader', 
            balance: 165200, 
            equity: 189980, 
            profit: 24780, 
            drawdown: 2.3,
            payouts: [7200, 5500, 4100, 2800, 1500],
            trades: 142,
            wins: 98
        },
        { 
            username: 'Courtney Wachira', 
            email: 'courtney@synth.com', 
            rank: 'Senior Trader', 
            balance: 142800, 
            equity: 159936, 
            profit: 17136, 
            drawdown: 2.1,
            payouts: [5600, 4200, 3100, 2200],
            trades: 128,
            wins: 87
        },
        { 
            username: 'Got funded090', 
            email: 'gotfunded@synth.com', 
            rank: 'Senior Trader', 
            balance: 98500, 
            equity: 112290, 
            profit: 13790, 
            drawdown: 2.8,
            payouts: [4500, 3200, 2400, 1800, 900],
            trades: 112,
            wins: 74
        },
        { 
            username: 'Gettin cash', 
            email: 'cash@synth.com', 
            rank: 'Pro Trader', 
            balance: 82300, 
            equity: 92176, 
            profit: 9876, 
            drawdown: 3.1,
            payouts: [3800, 2900, 2100, 1400],
            trades: 98,
            wins: 63
        },
        { 
            username: 'Bear_hunter867', 
            email: 'bear@synth.com', 
            rank: 'Trader', 
            balance: 67200, 
            equity: 74592, 
            profit: 7392, 
            drawdown: 3.5,
            payouts: [3200, 2400, 1800],
            trades: 85,
            wins: 52
        },
        { 
            username: 'fx dream', 
            email: 'dream@synth.com', 
            rank: 'Trader', 
            balance: 54600, 
            equity: 59514, 
            profit: 4914, 
            drawdown: 4.2,
            payouts: [2500, 1800, 1200],
            trades: 72,
            wins: 43
        },
        { 
            username: 'Eugene Kioko', 
            email: 'eugene@synth.com', 
            rank: 'Junior Trader', 
            balance: 42100, 
            equity: 45468, 
            profit: 3368, 
            drawdown: 3.8,
            payouts: [1800, 1400, 800],
            trades: 58,
            wins: 34
        },
        { 
            username: 'Deleted-84', 
            email: 'deleted@synth.com', 
            rank: 'Junior Trader', 
            balance: 31800, 
            equity: 34026, 
            profit: 2226, 
            drawdown: 4.5,
            payouts: [1200, 900, 600],
            trades: 45,
            wins: 26
        },
        { 
            username: 'Almost impossible', 
            email: 'almost@synth.com', 
            rank: 'Rookie', 
            balance: 22400, 
            equity: 23520, 
            profit: 1120, 
            drawdown: 3.0,
            payouts: [600, 400],
            trades: 32,
            wins: 18
        }
    ];
    
    fakeUsers.forEach((fake, index) => {
        const userId = `fake_${Date.now()}_${index}`;
        
        // Create user with hashed password
        db.users.push({
            id: userId,
            username: fake.username,
            email: fake.email,
            password: '$2a$10$hashed_password_for_fake_user',
            rank: fake.rank,
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        // Create balance
        db.balances.push({
            userId: userId,
            balance: fake.balance,
            equity: fake.equity,
            drawdown: fake.drawdown,
            profit: fake.profit,
            challenge: fake.balance >= 100000 ? '100000' : 
                       fake.balance >= 50000 ? '50000' :
                       fake.balance >= 25000 ? '25000' : '10000',
            peakEquity: fake.equity * (1 + (Math.random() * 0.05)),
            totalTrades: fake.trades,
            winningTrades: fake.wins,
            totalPayouts: fake.payouts.reduce((a, b) => a + b, 0)
        });
        
        // Add to leaderboard
        db.leaderboard.push({
            userId: userId,
            username: fake.username,
            profit: fake.profit,
            rank: 0
        });
        
        // Add achievements
        const achNames = ['First Trade', 'Consistent Winner', 'Profit Target Reached', 'Elite Status', '$10k Profit'];
        const numAch = Math.floor(Math.random() * 4) + 1;
        for (let i = 0; i < numAch; i++) {
            db.achievements.push({
                id: `ach_${Date.now()}_${index}_${i}`,
                userId: userId,
                name: achNames[i % achNames.length],
                earnedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        // Add payouts
        fake.payouts.forEach((amount, i) => {
            db.payouts.push({
                id: `pay_${Date.now()}_${index}_${i}`,
                userId: userId,
                amount: amount,
                date: new Date(Date.now() - (fake.payouts.length - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: i === 0 ? 'Pending' : 'Completed',
                transactionId: `PAY-${String(Date.now()).slice(-4)}${String(Math.random()).slice(2, 6)}`,
                description: `Trading profit payout`
            });
        });
        
        // Add journal entries
        const journalEntries = [
            'Scalping EUR/USD - great setup',
            'GBP/JPY breakout trade',
            'BTC/USD swing trade',
            'ETH/USD scalp - good entry',
            'SPX momentum trade'
        ];
        const numEntries = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < numEntries; i++) {
            db.journal.push({
                id: `jour_${Date.now()}_${index}_${i}`,
                userId: userId,
                entry: journalEntries[i % journalEntries.length],
                outcome: Math.random() > 0.3 ? '+120 pips' : '-30 pips',
                date: new Date(Date.now() - (numEntries - i) * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }
        
        // Add certificates
        if (fake.rank === 'Elite Trader' || fake.rank === 'Pro Trader' || fake.rank === 'Senior Trader') {
            const certNames = ['Certified Trader Level 1', 'Advanced Strategy', 'Elite Trader Certification'];
            const numCerts = fake.rank === 'Elite Trader' ? 3 : 2;
            for (let i = 0; i < numCerts; i++) {
                db.certificates.push({
                    id: `cert_${Date.now()}_${index}_${i}`,
                    userId: userId,
                    name: certNames[i % certNames.length],
                    earnedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                });
            }
        }
    });
    
    // Recalculate ranks
    const sorted = [...db.leaderboard].sort((a, b) => b.profit - a.profit);
    sorted.forEach((entry, index) => {
        entry.rank = index + 1;
    });
    
    writeDB(db);
    console.log(`✅ ${fakeUsers.length} fake users seeded successfully!`);
}

// ============ COMPETITION SYSTEM ============
function updateLeaderboardCompetition() {
    try {
        const db = readDB();
        
        // Randomly move fake users profits up/down
        db.leaderboard.forEach(entry => {
            if (entry.userId && entry.userId.startsWith('fake_')) {
                // Random movement between -1% and +2.5%
                const move = (Math.random() - 0.3) * 0.025;
                entry.profit = Math.max(0, entry.profit * (1 + move));
                entry.profit = Math.round(entry.profit * 100) / 100;
            }
        });
        
        // Recalculate ranks
        const sorted = [...db.leaderboard].sort((a, b) => b.profit - a.profit);
        sorted.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        
        writeDB(db);
        console.log('🔄 Leaderboard updated with new rankings!');
    } catch (error) {
        console.error('❌ Competition update error:', error);
    }
}

// Seed fake users on startup
seedFakeUsers();

// Run competition every 10 minutes
setInterval(() => {
    updateLeaderboardCompetition();
}, 600000);

// ============ TEST ROUTE ============
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// ============ REGISTER ============
app.post('/api/register', async (req, res) => {
    console.log('📝 Registration request received');
    
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const db = readDB();
        
        const existingUser = db.users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            rank: 'Junior Trader',
            createdAt: new Date().toISOString()
        };
        
        db.users.push(newUser);
        db.balances.push({
            userId: newUser.id,
            balance: 10000,
            equity: 10000,
            drawdown: 0,
            profit: 0,
            challenge: '10000',
            peakEquity: 10000,
            totalTrades: 0,
            winningTrades: 0,
            totalPayouts: 0
        });
        db.leaderboard.push({
            userId: newUser.id,
            username: newUser.username,
            profit: 0,
            rank: db.leaderboard.length + 1
        });
        
        db.payouts.push({
            id: Date.now().toString(),
            userId: newUser.id,
            amount: 100,
            date: new Date().toISOString().split('T')[0],
            status: 'Completed',
            description: '🎉 Welcome bonus!'
        });
        
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
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ BALANCE ROUTES ============
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

app.put('/api/balance', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { balance, equity, drawdown, profit, peakEquity, totalTrades, winningTrades, totalPayouts } = req.body;
        const index = db.balances.findIndex(b => b.userId === req.user.id);
        if (index !== -1) {
            db.balances[index] = { 
                ...db.balances[index], 
                balance: balance || db.balances[index].balance,
                equity: equity || db.balances[index].equity,
                drawdown: drawdown || db.balances[index].drawdown,
                profit: profit || db.balances[index].profit,
                peakEquity: peakEquity || db.balances[index].peakEquity,
                totalTrades: totalTrades || db.balances[index].totalTrades,
                winningTrades: winningTrades || db.balances[index].winningTrades,
                totalPayouts: totalPayouts || db.balances[index].totalPayouts
            };
            writeDB(db);
        }
        res.json({ message: 'Balance updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ TRADES ROUTES ============
app.get('/api/trades', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const trades = db.trades ? db.trades.filter(t => t.userId === req.user.id) : [];
        res.json(trades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/trades', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { type, amount, entry, exit, profit, status, currentPrice } = req.body;
        
        const trade = {
            id: Date.now().toString(),
            userId: req.user.id,
            type,
            amount,
            entry: entry || 0,
            exit: exit || null,
            profit: profit || 0,
            currentPrice: currentPrice || entry || 0,
            status: status || 'open',
            timestamp: new Date().toISOString()
        };
        
        if (!db.trades) db.trades = [];
        db.trades.push(trade);
        writeDB(db);
        
        res.json({ message: 'Trade saved', trade });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/trades/:id', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { id } = req.params;
        const { exit, profit, status } = req.body;
        
        const index = db.trades.findIndex(t => t.id === id && t.userId === req.user.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Trade not found' });
        }
        
        db.trades[index].exit = exit || db.trades[index].exit;
        db.trades[index].profit = profit || db.trades[index].profit;
        db.trades[index].status = status || 'closed';
        writeDB(db);
        
        res.json({ message: 'Trade closed', trade: db.trades[index] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ POSITIONS ROUTES ============
app.get('/api/positions', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const positions = db.positions ? db.positions.filter(p => p.userId === req.user.id && p.status === 'open') : [];
        res.json(positions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/positions', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { type, amount, entry, currentPrice } = req.body;
        
        const position = {
            id: Date.now().toString(),
            userId: req.user.id,
            type,
            amount,
            entry: entry || 0,
            currentPrice: currentPrice || entry || 0,
            profit: 0,
            status: 'open',
            timestamp: new Date().toISOString()
        };
        
        if (!db.positions) db.positions = [];
        db.positions.push(position);
        writeDB(db);
        
        res.json({ message: 'Position opened', position });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/positions/:id', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { id } = req.params;
        
        db.positions = db.positions.filter(p => p.id !== id || p.userId !== req.user.id);
        writeDB(db);
        
        res.json({ message: 'Position closed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ PAYOUTS ROUTES ============
app.get('/api/payouts', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const payouts = db.payouts ? db.payouts.filter(p => p.userId === req.user.id) : [];
        res.json(payouts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payouts', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { amount, date, status, description, transactionId } = req.body;
        
        const payout = {
            id: Date.now().toString(),
            userId: req.user.id,
            amount: amount || 0,
            date: date || new Date().toISOString().split('T')[0],
            status: status || 'Pending',
            description: description || 'Trading profit payout',
            transactionId: transactionId || `PAY-${Date.now().toString().slice(-8)}`
        };
        
        if (!db.payouts) db.payouts = [];
        db.payouts.push(payout);
        writeDB(db);
        
        res.json({ message: 'Payout recorded', payout });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ACHIEVEMENTS ROUTES ============
app.get('/api/achievements', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const achievements = db.achievements ? db.achievements.filter(a => a.userId === req.user.id) : [];
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/achievements', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { name } = req.body;
        
        const achievement = {
            id: Date.now().toString(),
            userId: req.user.id,
            name: name || 'New Achievement',
            earnedAt: new Date().toISOString()
        };
        
        if (!db.achievements) db.achievements = [];
        db.achievements.push(achievement);
        writeDB(db);
        
        res.json({ message: 'Achievement earned', achievement });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ JOURNAL ROUTES ============
app.get('/api/journal', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const journal = db.journal ? db.journal.filter(j => j.userId === req.user.id) : [];
        res.json(journal);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/journal', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { entry, outcome, date } = req.body;
        
        const journalEntry = {
            id: Date.now().toString(),
            userId: req.user.id,
            entry: entry || 'Journal entry',
            outcome: outcome || 'pending',
            date: date || new Date().toISOString().split('T')[0]
        };
        
        if (!db.journal) db.journal = [];
        db.journal.push(journalEntry);
        writeDB(db);
        
        res.json({ message: 'Journal entry added', journalEntry });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ CERTIFICATES ROUTES ============
app.get('/api/certificates', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const certs = db.certificates ? db.certificates.filter(c => c.userId === req.user.id) : [];
        res.json(certs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/certificates', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { name } = req.body;
        
        const cert = {
            id: Date.now().toString(),
            userId: req.user.id,
            name: name || 'New Certificate',
            earnedAt: new Date().toISOString()
        };
        
        if (!db.certificates) db.certificates = [];
        db.certificates.push(cert);
        writeDB(db);
        
        res.json({ message: 'Certificate earned', cert });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ LEADERBOARD ROUTES ============
app.get('/api/leaderboard', (req, res) => {
    try {
        const db = readDB();
        const leaderboard = db.leaderboard ? [...db.leaderboard].sort((a, b) => b.profit - a.profit) : [];
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/leaderboard', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { profit } = req.body;
        
        const existing = db.leaderboard.find(l => l.userId === req.user.id);
        if (existing) {
            existing.profit = profit || 0;
        } else {
            db.leaderboard.push({
                userId: req.user.id,
                username: req.user.username,
                profit: profit || 0
            });
        }
        
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

// ============ CHALLENGE ROUTE ============
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
                peakEquity: challenge.balance,
                totalTrades: 0,
                winningTrades: 0,
                totalPayouts: 0
            };
            db.positions = db.positions.filter(p => p.userId !== req.user.id);
            db.trades = db.trades.filter(t => t.userId !== req.user.id);
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

// ============ FUND USER ============
app.post('/api/fund', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const { userId, amount, fromUser } = req.body;
        
        if (!userId || !amount || amount <= 0 || amount > 10000) {
            return res.status(400).json({ error: 'Invalid funding request' });
        }
        
        // Find target user
        const targetUser = db.users.find(u => u.id === userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Find target balance
        const targetBalance = db.balances.find(b => b.userId === userId);
        if (!targetBalance) {
            return res.status(404).json({ error: 'User balance not found' });
        }
        
        // Update target balance
        targetBalance.balance += amount;
        targetBalance.equity += amount;
        
        // Add to target leaderboard profit
        const targetLeaderboard = db.leaderboard.find(l => l.userId === userId);
        if (targetLeaderboard) {
            targetLeaderboard.profit += amount * 0.5; // 50% of funding counts as profit
        }
        
        // Record funding as a payout for the target user
        db.payouts.push({
            id: Date.now().toString(),
            userId: userId,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            status: 'Completed',
            description: `💲 Funded by ${fromUser}`,
            transactionId: `FUND-${Date.now().toString().slice(-8)}`
        });
        
        writeDB(db);
        
        res.json({ 
            success: true, 
            message: `Successfully funded ${targetUser.username}`,
            username: targetUser.username
        });
        
    } catch (error) {
        console.error('❌ Funding error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ DASHBOARD ROUTE ============
app.get('/api/dashboard', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const userId = req.user.id;
        
        const balance = db.balances.find(b => b.userId === userId) || { balance: 10000, equity: 10000, profit: 0 };
        const trades = db.trades ? db.trades.filter(t => t.userId === userId) : [];
        const payouts = db.payouts ? db.payouts.filter(p => p.userId === userId) : [];
        const achievements = db.achievements ? db.achievements.filter(a => a.userId === userId) : [];
        const journal = db.journal ? db.journal.filter(j => j.userId === userId) : [];
        const certificates = db.certificates ? db.certificates.filter(c => c.userId === userId) : [];
        const positions = db.positions ? db.positions.filter(p => p.userId === userId && p.status === 'open') : [];
        
        const totalTrades = trades.length;
        const winningTrades = trades.filter(t => t.profit > 0).length;
        const totalPayouts = payouts.reduce((sum, p) => sum + (p.status === 'Completed' ? p.amount : 0), 0);
        const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;
        
        res.json({
            balance,
            trades,
            payouts,
            achievements,
            journal,
            certificates,
            positions,
            totalTrades,
            winningTrades,
            totalPayouts,
            winRate
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
