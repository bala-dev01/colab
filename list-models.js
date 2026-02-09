
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Please provide GEMINI_API_KEY environment variable");
    process.exit(1);
}

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.models) {
            console.log(JSON.stringify(data.models.map(m => m.name.replace('models/', '')), null, 2));
        } else {
            console.log("No models found:", data);
        }
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
