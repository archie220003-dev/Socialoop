import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/socialoop');
        console.log('Connected to MongoDB.');

        const users = await User.find();
        console.log(`Found ${users.length} users. Checking for duplicates...`);

        for (const user of users) {
            let updated = false;

            // Cleanup followers
            const uniqueFollowers = [...new Set(user.followers.map(id => id.toString()))];
            if (uniqueFollowers.length !== user.followers.length) {
                user.followers = uniqueFollowers;
                updated = true;
                console.log(`Fixed followers for user: ${user.username}`);
            }

            // Cleanup following
            const uniqueFollowing = [...new Set(user.following.map(id => id.toString()))];
            if (uniqueFollowing.length !== user.following.length) {
                user.following = uniqueFollowing;
                updated = true;
                console.log(`Fixed following for user: ${user.username}`);
            }

            if (updated) {
                await user.save();
            }
        }

        console.log('Cleanup completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Cleanup failed:', err);
        process.exit(1);
    }
};

cleanup();
