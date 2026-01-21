const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Testing with Key starting with:", apiKey ? apiKey.substring(0, 8) : "NONE");

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            console.log(`✅ SUCCESS [${modelName}]:`, await result.response.text());
            return; // Exit on first success
        } catch (e) {
            console.error(`❌ FAILED [${modelName}]:`, e.message.split('\n')[0]);
        }
    }
    console.log("All attempts failed.");
}

main();
