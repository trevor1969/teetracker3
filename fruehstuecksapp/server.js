const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: 'fruehstueck-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Database setup
const db = new sqlite3.Database('./fruehstueck.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Users table (for staff/admin)
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'employee'
            )
        `);

        // Accounts table (for visitors)
        db.run(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                pin TEXT NOT NULL,
                balance REAL NOT NULL DEFAULT 0.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Items table (for fixed price items)
        db.run(`
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                description TEXT
            )
        `);

        // Transactions table
        db.run(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal')),
                amount REAL NOT NULL,
                description TEXT,
                item_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (account_id) REFERENCES accounts(id),
                FOREIGN KEY (item_id) REFERENCES items(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);

        // Insert default admin user if not exists
        db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
            if (err) {
                console.error('Error checking admin user:', err);
                return;
            }
            if (!row) {
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
                    ['admin', hashedPassword, 'admin'], (err) => {
                        if (err) console.error('Error creating admin user:', err);
                        else console.log('Default admin user created');
                    });
            }
        });

        // Insert some default items if none exist
        db.get("SELECT COUNT(*) as count FROM items", (err, row) => {
            if (err) {
                console.error('Error checking items:', err);
                return;
            }
            if (row.count === 0) {
                const items = [
                    { name: 'Kaffee', price: 1.50, description: 'Tasse Kaffee' },
                    { name: 'Tee', price: 1.20, description: 'Tasse Tee' },
                    { name: 'Brötchen', price: 0.80, description: 'Ein Brötchen' },
                    { name: 'Butter', price: 0.30, description: 'Portion Butter' },
                    { name: 'Marmelade', price: 0.30, description: 'Portion Marmelade' },
                    { name: 'Frischkäse', price: 0.50, description: 'Portion Frischkäse' },
                    { name: 'Honig', price: 0.40, description: 'Portion Honig' },
                    { name: 'Müsli', price: 2.00, description: 'Portion Müsli' },
                    { name: 'Joghurt', price: 1.00, description: 'Becher Joghurt' },
                    { name: 'Obst', price: 1.50, description: 'Portion Obst' }
                ];
                
                items.forEach(item => {
                    db.run("INSERT INTO items (name, price, description) VALUES (?, ?, ?)",
                        [item.name, item.price, item.description]);
                });
                console.log('Default items inserted');
            }
        });
    });
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {
            if (err || !user) {
                return res.redirect('/login');
            }
            req.user = user;
            next();
        });
    } else {
        res.redirect('/login');
    }
}

function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Zugriff verweigert: Nur für Administratoren');
}

// Helper function to get account by PIN
function getAccountByPin(pin, callback) {
    db.all("SELECT * FROM accounts", (err, accounts) => {
        if (err) {
            return callback(err, null);
        }
        const matchingAccount = accounts.find(acc => bcrypt.compareSync(pin, acc.pin));
        callback(null, matchingAccount);
    });
}

// Routes
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Login routes
app.get('/login', (req, res) => {
    res.render('login', { error: null, user: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) {
            return res.render('login', { error: 'Benutzername oder Passwort falsch', user: null });
        }
        if (bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Benutzername oder Passwort falsch', user: null });
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
    const isAdmin = req.user.role === 'admin';
    
    // Get recent transactions
    db.all(`
        SELECT t.*, a.name as account_name, u.username as created_by_name, i.name as item_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN items i ON t.item_id = i.id
        ORDER BY t.created_at DESC
        LIMIT 20
    `, (err, transactions) => {
        if (err) {
            console.error('Error fetching transactions:', err);
            transactions = [];
        }
        
        // Get accounts count and total balance
        db.get("SELECT COUNT(*) as count, SUM(balance) as total_balance FROM accounts", (err, stats) => {
            res.render('dashboard', {
                user: req.user,
                isAdmin: isAdmin,
                transactions: transactions,
                stats: stats
            });
        });
    });
});

// Account routes
app.get('/accounts', requireAuth, (req, res) => {
    db.all("SELECT * FROM accounts ORDER BY name", (err, accounts) => {
        if (err) {
            console.error('Error fetching accounts:', err);
            accounts = [];
        }
        res.render('accounts', {
            user: req.user,
            accounts: accounts,
            isAdmin: req.user.role === 'admin'
        });
    });
});

app.get('/accounts/new', requireAuth, (req, res) => {
    res.render('account_new', { user: req.user, error: null });
});

app.post('/accounts', requireAuth, (req, res) => {
    const { name, pin, initialBalance } = req.body;
    const balance = parseFloat(initialBalance) || 0;
    
    // Hash the PIN
    const hashedPin = bcrypt.hashSync(pin, 10);
    
    db.run("INSERT INTO accounts (name, pin, balance) VALUES (?, ?, ?)", 
        [name, hashedPin, balance], function(err) {
            if (err) {
                console.error('Error creating account:', err);
                return res.render('account_new', { 
                    user: req.user, 
                    error: 'Fehler beim Anlegen des Kontos' 
                });
            }
            
            // Record initial deposit if balance > 0
            if (balance > 0) {
                db.run("INSERT INTO transactions (account_id, type, amount, description, created_by) VALUES (?, ?, ?, ?, ?)",
                    [this.lastID, 'deposit', balance, 'Anfangsguthaben', req.user.id]);
            }
            
            res.redirect('/accounts');
        });
});

app.get('/accounts/:id', requireAuth, (req, res) => {
    const accountId = req.params.id;
    
    db.get("SELECT * FROM accounts WHERE id = ?", [accountId], (err, account) => {
        if (err || !account) {
            return res.status(404).send('Konto nicht gefunden');
        }
        
        // Get transactions for this account
        db.all(`
            SELECT t.*, u.username as created_by_name, i.name as item_name
            FROM transactions t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN items i ON t.item_id = i.id
            WHERE t.account_id = ?
            ORDER BY t.created_at DESC
        `, [accountId], (err, transactions) => {
            if (err) {
                console.error('Error fetching transactions:', err);
                transactions = [];
            }
            
            res.render('account_detail', {
                user: req.user,
                account: account,
                transactions: transactions,
                isAdmin: req.user.role === 'admin'
            });
        });
    });
});

app.get('/accounts/:id/edit', requireAuth, (req, res) => {
    const accountId = req.params.id;
    
    db.get("SELECT * FROM accounts WHERE id = ?", [accountId], (err, account) => {
        if (err || !account) {
            return res.status(404).send('Konto nicht gefunden');
        }
        res.render('account_edit', { user: req.user, account: account, error: null });
    });
});

app.post('/accounts/:id', requireAuth, (req, res) => {
    const accountId = req.params.id;
    const { name, pin } = req.body;
    
    let updateQuery = "UPDATE accounts SET name = ?";
    const params = [name];
    
    if (pin) {
        const hashedPin = bcrypt.hashSync(pin, 10);
        updateQuery += ", pin = ?";
        params.push(hashedPin);
    }
    
    updateQuery += " WHERE id = ?";
    params.push(accountId);
    
    db.run(updateQuery, params, (err) => {
        if (err) {
            console.error('Error updating account:', err);
            return res.redirect(`/accounts/${accountId}/edit`);
        }
        res.redirect(`/accounts/${accountId}`);
    });
});

// PDF Export route
app.get('/accounts/:id/pdf', requireAuth, (req, res) => {
    const accountId = req.params.id;
    
    db.get("SELECT * FROM accounts WHERE id = ?", [accountId], (err, account) => {
        if (err || !account) {
            return res.status(404).send('Konto nicht gefunden');
        }
        
        // Get all transactions for this account
        db.all(`
            SELECT t.*, u.username as created_by_name, i.name as item_name
            FROM transactions t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN items i ON t.item_id = i.id
            WHERE t.account_id = ?
            ORDER BY t.created_at DESC
        `, [accountId], (err, transactions) => {
            if (err) {
                console.error('Error fetching transactions for PDF:', err);
                return res.status(500).send('Fehler beim Generieren des PDFs');
            }
            
            // Create PDF document
            const doc = new PDFDocument({ margin: 30 });
            
            // Set response headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Kontoauszug_${account.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`);
            
            // Pipe the PDF to the response
            doc.pipe(res);
            
            // Add content to PDF
            doc.fontSize(20).text(`Kontoauszug für ${account.name}`, { align: 'center' });
            doc.moveDown();
            
            doc.fontSize(14).text(`Kontostand: ${account.balance.toFixed(2)} €`);
            doc.fontSize(12).text(`Erstellt am: ${new Date(account.created_at).toLocaleDateString('de-DE')}`);
            doc.moveDown(2);
            
            doc.fontSize(16).text('Transaktionshistorie:', { underline: true });
            doc.moveDown();
            
            // Table headers
            const table = {
                headers: ['Datum', 'Typ', 'Betrag', 'Beschreibung', 'Artikel', 'Durchgeführt von'],
                rows: []
            };
            
            transactions.forEach(tx => {
                table.rows.push([
                    new Date(tx.created_at).toLocaleString('de-DE'),
                    tx.type === 'deposit' ? 'Einzahlung' : 'Abbuchung',
                    `${tx.amount.toFixed(2)} €`,
                    tx.description || '-',
                    tx.item_name || '-',
                    tx.created_by_name || 'System'
                ]);
            });
            
            // Draw table
            const tableTop = doc.y;
            const columnSpacing = 10;
            const columnWidths = [80, 60, 50, 120, 80, 80];
            
            // Draw headers
            doc.font('Helvetica-Bold');
            let x = 30;
            table.headers.forEach((header, i) => {
                doc.text(header, x, tableTop, { width: columnWidths[i], align: 'left' });
                x += columnWidths[i] + columnSpacing;
            });
            doc.font('Helvetica');
            
            // Draw rows
            let y = tableTop + 20;
            transactions.forEach((tx, rowIndex) => {
                x = 30;
                const row = table.rows[rowIndex];
                row.forEach((cell, i) => {
                    doc.text(cell, x, y, { width: columnWidths[i], align: 'left' });
                    x += columnWidths[i] + columnSpacing;
                });
                y += 20;
                
                // Add horizontal line between rows
                if (rowIndex < transactions.length - 1) {
                    doc.moveTo(30, y - 5).lineTo(550, y - 5).stroke('#cccccc');
                }
            });
            
            doc.moveDown(2);
            doc.fontSize(10).text(`Generiert am: ${new Date().toLocaleString('de-DE')}`, { align: 'right' });
            doc.fontSize(10).text(`Generiert von: ${req.user.username}`, { align: 'right' });
            
            // Finalize PDF
            doc.end();
        });
    });
});

// Deposit routes
app.get('/accounts/:id/deposit', requireAuth, (req, res) => {
    const accountId = req.params.id;
    
    db.get("SELECT * FROM accounts WHERE id = ?", [accountId], (err, account) => {
        if (err || !account) {
            return res.status(404).send('Konto nicht gefunden');
        }
        res.render('deposit', { user: req.user, account: account, error: null });
    });
});

app.post('/accounts/:id/deposit', requireAuth, (req, res) => {
    const accountId = req.params.id;
    const { amount, description } = req.body;
    const depositAmount = parseFloat(amount);
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.redirect(`/accounts/${accountId}/deposit?error=invalid_amount`);
    }
    
    // Update account balance
    db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", 
        [depositAmount, accountId], function(err) {
            if (err) {
                console.error('Error updating balance:', err);
                return res.redirect(`/accounts/${accountId}/deposit?error=database_error`);
            }
            
            // Record transaction
            db.run("INSERT INTO transactions (account_id, type, amount, description, created_by) VALUES (?, ?, ?, ?, ?)",
                [accountId, 'deposit', depositAmount, description || 'Einzahlung', req.user.id], 
                (err) => {
                    if (err) console.error('Error recording transaction:', err);
                    res.redirect(`/accounts/${accountId}`);
                });
        });
});

// Withdrawal routes
app.get('/accounts/:id/withdraw', requireAuth, (req, res) => {
    const accountId = req.params.id;
    
    db.get("SELECT * FROM accounts WHERE id = ?", [accountId], (err, account) => {
        if (err || !account) {
            return res.status(404).send('Konto nicht gefunden');
        }
        
        // Get all items for selection
        db.all("SELECT * FROM items ORDER BY name", (err, items) => {
            if (err) {
                console.error('Error fetching items:', err);
                items = [];
            }
            
            res.render('withdraw', { 
                user: req.user, 
                account: account,
                items: items,
                error: req.query.error
            });
        });
    });
});

app.post('/accounts/:id/withdraw', requireAuth, (req, res) => {
    const accountId = req.params.id;
    const { amount, description, itemId, customAmount } = req.body;
    
    let withdrawalAmount;
    let finalDescription = description || '';
    
    if (itemId) {
        // Fixed price item
        db.get("SELECT * FROM items WHERE id = ?", [itemId], (err, item) => {
            if (err || !item) {
                return res.redirect(`/accounts/${accountId}/withdraw?error=invalid_item`);
            }
            withdrawalAmount = item.price;
            finalDescription = item.name + (description ? ` - ${description}` : '');
            processWithdrawal();
        });
    } else {
        // Custom amount
        withdrawalAmount = parseFloat(customAmount);
        if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
            return res.redirect(`/accounts/${accountId}/withdraw?error=invalid_amount`);
        }
        processWithdrawal();
    }
    
    function processWithdrawal() {
        // Check if account has sufficient balance
        db.get("SELECT balance FROM accounts WHERE id = ?", [accountId], (err, account) => {
            if (err || !account) {
                return res.redirect(`/accounts/${accountId}/withdraw?error=account_not_found`);
            }
            
            if (account.balance < withdrawalAmount) {
                return res.redirect(`/accounts/${accountId}/withdraw?error=insufficient_funds`);
            }
            
            // Update account balance
            db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", 
                [withdrawalAmount, accountId], function(err) {
                    if (err) {
                        console.error('Error updating balance:', err);
                        return res.redirect(`/accounts/${accountId}/withdraw?error=database_error`);
                    }
                    
                    // Record transaction
                    const transactionData = [
                        accountId, 
                        'withdrawal', 
                        withdrawalAmount, 
                        finalDescription,
                        req.user.id
                    ];
                    
                    if (itemId) {
                        transactionData.push(itemId);
                        db.run(`
                            INSERT INTO transactions (account_id, type, amount, description, created_by, item_id) 
                            VALUES (?, ?, ?, ?, ?, ?)
                        `, transactionData, (err) => {
                            if (err) console.error('Error recording transaction:', err);
                            res.redirect(`/accounts/${accountId}`);
                        });
                    } else {
                        db.run(`
                            INSERT INTO transactions (account_id, type, amount, description, created_by) 
                            VALUES (?, ?, ?, ?, ?)
                        `, transactionData, (err) => {
                            if (err) console.error('Error recording transaction:', err);
                            res.redirect(`/accounts/${accountId}`);
                        });
                    }
                });
        });
    }
});

// Items routes (admin only)
app.get('/items', requireAuth, requireAdmin, (req, res) => {
    db.all("SELECT * FROM items ORDER BY name", (err, items) => {
        if (err) {
            console.error('Error fetching items:', err);
            items = [];
        }
        res.render('items', { user: req.user, items: items });
    });
});

app.get('/items/new', requireAuth, requireAdmin, (req, res) => {
    res.render('item_new', { user: req.user, error: null, name: '', price: '', description: '' });
});

app.post('/items', requireAuth, requireAdmin, (req, res) => {
    const { name, price, description } = req.body;
    const itemPrice = parseFloat(price);
    
    if (isNaN(itemPrice) || itemPrice <= 0) {
        return res.render('item_new', { 
            user: req.user, 
            error: 'Ungültiger Preis',
            name: name,
            description: description
        });
    }
    
    db.run("INSERT INTO items (name, price, description) VALUES (?, ?, ?)", 
        [name, itemPrice, description], (err) => {
            if (err) {
                console.error('Error creating item:', err);
                return res.render('item_new', { 
                    user: req.user, 
                    error: 'Fehler beim Anlegen des Artikels',
                    name: name,
                    description: description
                });
            }
            res.redirect('/items');
        });
});

app.get('/items/:id/edit', requireAuth, requireAdmin, (req, res) => {
    const itemId = req.params.id;
    
    db.get("SELECT * FROM items WHERE id = ?", [itemId], (err, item) => {
        if (err || !item) {
            return res.status(404).send('Artikel nicht gefunden');
        }
        res.render('item_edit', { user: req.user, item: item, error: null });
    });
});

app.post('/items/:id', requireAuth, requireAdmin, (req, res) => {
    const itemId = req.params.id;
    const { name, price, description } = req.body;
    const itemPrice = parseFloat(price);
    
    if (isNaN(itemPrice) || itemPrice <= 0) {
        return res.redirect(`/items/${itemId}/edit?error=invalid_price`);
    }
    
    db.run("UPDATE items SET name = ?, price = ?, description = ? WHERE id = ?", 
        [name, itemPrice, description, itemId], (err) => {
            if (err) {
                console.error('Error updating item:', err);
                return res.redirect(`/items/${itemId}/edit?error=database_error`);
            }
            res.redirect('/items');
        });
});

app.post('/items/:id/delete', requireAuth, requireAdmin, (req, res) => {
    const itemId = req.params.id;
    
    db.run("DELETE FROM items WHERE id = ?", [itemId], (err) => {
        if (err) {
            console.error('Error deleting item:', err);
            return res.redirect('/items?error=delete_failed');
        }
        res.redirect('/items');
    });
});

// User management routes (admin only)
app.get('/users', requireAuth, requireAdmin, (req, res) => {
    db.all("SELECT * FROM users ORDER BY username", (err, users) => {
        if (err) {
            console.error('Error fetching users:', err);
            users = [];
        }
        res.render('users', { user: req.user, users: users });
    });
});

app.get('/users/new', requireAuth, requireAdmin, (req, res) => {
    res.render('user_new', { user: req.user, error: null, username: '', role: 'employee' });
});

app.post('/users', requireAuth, requireAdmin, (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
        [username, hashedPassword, role], (err) => {
            if (err) {
                console.error('Error creating user:', err);
                return res.render('user_new', { 
                    user: req.user, 
                    error: 'Fehler beim Anlegen des Benutzers',
                    username: username,
                    role: role
                });
            }
            res.redirect('/users');
        });
});

app.post('/users/:id/delete', requireAuth, requireAdmin, (req, res) => {
    const userId = req.params.id;
    
    // Prevent deleting current user
    if (userId == req.user.id) {
        return res.redirect('/users?error=cannot_delete_self');
    }
    
    db.run("DELETE FROM users WHERE id = ?", [userId], (err) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.redirect('/users?error=delete_failed');
        }
        res.redirect('/users');
    });
});

// PIN check route for visitors
app.get('/pin-check', (req, res) => {
    res.render('pin_check', { error: null, success: false, account: null, transactions: null, user: null });
});

app.post('/pin-check', (req, res) => {
    const { pin } = req.body;
    
    if (!pin) {
        return res.render('pin_check', { error: 'Bitte geben Sie eine PIN ein', success: false, account: null, transactions: null, user: null });
    }
    
    getAccountByPin(pin, (err, account) => {
        if (err || !account) {
            return res.render('pin_check', { error: 'Ungültige PIN', success: false, account: null, transactions: null, user: null });
        }
        
        // Get last 10 transactions for this account
        db.all(`
            SELECT t.*, u.username as created_by_name, i.name as item_name
            FROM transactions t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN items i ON t.item_id = i.id
            WHERE t.account_id = ?
            ORDER BY t.created_at DESC
            LIMIT 10
        `, [account.id], (err, transactions) => {
            if (err) {
                console.error('Error fetching transactions for PIN check:', err);
                transactions = [];
            }
            
            res.render('pin_check', {
                error: null,
                success: true,
                account: account,
                transactions: transactions,
                user: null
            });
        });
    });
});

// API endpoint for PIN check (for potential mobile app integration)
app.post('/api/pin-check', (req, res) => {
    const { pin } = req.body;
    
    if (!pin) {
        return res.json({ error: 'PIN ist erforderlich' });
    }
    
    getAccountByPin(pin, (err, account) => {
        if (err || !account) {
            return res.json({ error: 'Ungültige PIN' });
        }
        
        // Get last 10 transactions
        db.all(`
            SELECT t.*, u.username as created_by_name, i.name as item_name
            FROM transactions t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN items i ON t.item_id = i.id
            WHERE t.account_id = ?
            ORDER BY t.created_at DESC
            LIMIT 10
        `, [account.id], (err, transactions) => {
            if (err) {
                console.error('Error fetching transactions:', err);
                transactions = [];
            }
            
            res.json({
                success: true,
                name: account.name,
                balance: account.balance,
                transactions: transactions.map(tx => ({
                    date: tx.created_at,
                    type: tx.type,
                    amount: tx.amount,
                    description: tx.description,
                    item: tx.item_name,
                    by: tx.created_by_name
                }))
            });
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Handle database close on exit
process.on('SIGINT', () => {
    db.close();
    process.exit();
});

process.on('SIGTERM', () => {
    db.close();
    process.exit();
});
