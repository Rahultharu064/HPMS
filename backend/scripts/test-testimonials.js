// const fetch = require('node-fetch'); // Native fetch used

const BASE_URL = 'http://localhost:5000/api/testimonials';

async function testTestimonials() {
    console.log('Testing Testimonials API...');

    try {
        // 1. Get all testimonials (Public)
        console.log('1. GET /api/testimonials');
        const res = await fetch(BASE_URL);
        if (!res.ok) {
            throw new Error(`Failed to fetch testimonials: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log('   Success! Count:', Array.isArray(data) ? data.length : 'Not an array');
        console.log('   Data:', data);

    } catch (error) {
        console.error('   Failed:', error.message);
    }
}

// Check if node version supports fetch, otherwise warn
if (!globalThis.fetch) {
    console.error('Node version does not support native fetch. Please use Node 18+ or install node-fetch.');
} else {
    testTestimonials();
}
