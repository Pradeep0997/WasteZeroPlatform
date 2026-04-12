const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user.model');

dotenv.config();

async function runTest() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://pradeepreddysettipalle_db_user:F59a4FIGrs18tRIk@cluster0.xpfbhs1.mongodb.net/test?appName=Cluster0');
    const volunteer = await User.findOne({ role: 'volunteer' });
    const ngo = await User.findOne({ role: 'ngo' });

    if (!volunteer || !ngo) {
        console.log('Missing docs');
        process.exit();
    }

    // Generate a token for volunteer manually to bypass login UI
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: volunteer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    try {
        const response = await fetch(`http://localhost:4000/api/messages/send/${ngo._id.toString()}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `token=${token}`,
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ message: "Hello from native fetch!" })
        });
        const data = await response.json();
        console.log("Message sent status:", response.status, data);
    } catch (err) {
        console.error("Failed to send:", err.message);
    }

    process.exit();
}

runTest();
