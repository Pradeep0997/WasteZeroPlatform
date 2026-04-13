const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user.model');
const { getReceiverSocketId, io } = require("./socket/socket");

dotenv.config();

mongoose.connect(process.env.MONGO_URI )
    .then(async () => {
        console.log("Connected to MongoDB for testing");

        const volunteer = await User.findOne({ role: 'volunteer' });
        const ngo = await User.findOne({ role: 'ngo' });

        if (!volunteer || !ngo) {
            console.log("Missing volunteer or ngo");
            process.exit(0);
        }

        console.log(`Volunteer: ${volunteer._id}`);
        console.log(`NGO: ${ngo._id}`);

        // Create a dummy mock
        const fetchSocket = getReceiverSocketId(ngo._id.toString());
        console.log(`Is NGO alive in socket?:`, fetchSocket);

        process.exit(0);
    })
    .catch(err => {
        console.error("Failed", err);
        process.exit(1);
    });
