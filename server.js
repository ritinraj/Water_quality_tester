/**
 * server.js
 * ----------
 * A minimal Express backend that stores user sign-up / sign-in
 * data in a local JSON file (data/users.json).
 *
 * Endpoints:
 *   POST /api/signup   – register a new user
 *   POST /api/login    – authenticate an existing user
 *   GET  /api/users    – list all users (for debugging; remove in production)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const SALT_ROUNDS = 10;
const GOOGLE_CLIENT = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const PORT = 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── JSON file path ────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure the data directory and file exist on startup
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const readUsers = () => {
    try {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(raw).users || [];
    } catch {
        return [];
    }
};

const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
};

// ── POST /api/signup ──────────────────────────────────────────────────────────
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = readUsers();

    // Check duplicate
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash the password before saving — plain text is never stored
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = {
        email,
        password: hashedPassword,  // ✅ bcrypt hash stored, not plain text
        createdAt: new Date().toISOString(),
        profile: null,
    };
    users.push(newUser);
    writeUsers(users);

    return res.status(201).json({ message: 'Account created successfully.', email });
});

// ── POST /api/login ───────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(404).json({ error: 'No account found with this email.' });
    }

    // Compare entered password against the stored bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    return res.status(200).json({
        message: 'Login successful.',
        email: user.email,
        profile: user.profile || null,
    });
});

// ── POST /api/profile ─────────────────────────────────────────────────────────
app.post('/api/profile', (req, res) => {
    const { email, profile } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    const users = readUsers();
    const idx = users.findIndex(u => u.email === email);

    if (idx === -1) {
        return res.status(404).json({ error: 'User not found.' });
    }

    users[idx].profile = { ...profile, completedAt: new Date().toISOString() };
    writeUsers(users);

    return res.status(200).json({ message: 'Profile saved.', profile: users[idx].profile });
});

// ── POST /api/google-auth ─────────────────────────────────────────────────────
app.post('/api/google-auth', async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ error: 'Google credential is required.' });
    }

    try {
        // Verify the Google JWT with Google's public keys
        const ticket = await GOOGLE_CLIENT.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name || '';

        const users = readUsers();
        let user = users.find(u => u.email === email);

        if (!user) {
            // New Google user — auto-create account (no password needed)
            user = {
                email,
                password: null,
                googleAuth: true,
                createdAt: new Date().toISOString(),
                profile: null,
            };
            users.push(user);
            writeUsers(users);
        }

        return res.status(200).json({
            message: 'Google auth successful.',
            email: user.email,
            name,
            profile: user.profile || null,
        });
    } catch (err) {
        console.error('Google token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid Google token. Please try again.' });
    }
});

// ── GET /api/users (debug only) ───────────────────────────────────────────────
app.get('/api/users', (req, res) => {
    const users = readUsers();
    // Mask passwords before returning
    const safe = users.map(({ password, ...rest }) => rest);
    return res.json({ users: safe });
});


// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅  Auth server running at http://localhost:${PORT}`);
    console.log(`📄  User data stored in: ${USERS_FILE}`);
});
