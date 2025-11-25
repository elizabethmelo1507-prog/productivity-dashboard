const https = require('https');

const apiKey = 'AIzaSyBsnsncqnJTugUmYi1lF0IWz6Nf-0TG95U';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (response.models) {
                console.log('Available models:');
                response.models.forEach(model => {
                    if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`- ${model.name}`);
                    }
                });
            } else {
                console.log('No models found or error:', response);
            }
        } catch (e) {
            console.error('Error parsing response:', e);
        }
    });
}).on('error', (err) => {
    console.error('Error fetching models:', err);
});
