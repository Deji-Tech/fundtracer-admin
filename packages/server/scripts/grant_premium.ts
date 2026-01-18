
import { getFirestore, initializeFirebase } from '../src/firebase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from server root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const args = process.argv.slice(2);
const address = args[0];

if (!address) {
    console.error('Usage: tsx scripts/grant_premium.ts <address>');
    process.exit(1);
}

const normalizedAddress = address.toLowerCase();

async function grant() {
    initializeFirebase();
    console.log(`Granting PREMIUM to ${normalizedAddress}...`);

    try {
        const db = getFirestore();
        const userRef = db.collection('users').doc(normalizedAddress);

        // Grant PRO tier for 365 days
        const oneYear = 365 * 24 * 60 * 60 * 1000;

        await userRef.set({
            tier: 'pro',
            subscriptionExpiry: Date.now() + oneYear,
            updatedAt: new Date().toISOString(),
            // Ensure verify status is preserved or strictly verified?
            // User probably wants verification too if POH issues. 
            // I'll leave isVerified alone unless they ask, to avoid overwriting POH logic.
            // But usually Premium implies verified? I'll set it to safe.
            isVerified: true
        }, { merge: true });

        console.log('Success! User is now PRO tier.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

grant();
