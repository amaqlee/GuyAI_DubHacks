# GuyAI

An AI business assistant that helps small business owners track weekly performance, receive pricing recommendations, and manage inventory.

---

How to run guyAI locally:
1) You will need
-  Python 3
-  Node.js
-  Google Gemini API Key (get a free one here: [aistudio.google.com/api-keys](https://aistudio.google.com/api-keys))

2) Start the backend
-  Open a terminal and navigate to the backend folder
```bash
cd guyAI/backend
python3 app.py
```
-  Set the API Key
```bash
export GEMINI_API_KEY="YOUR_API_KEY_HERE"
```
-  Start the Flask server:
```bash
python3 app.py
```

2) Start the frontend
-  Open a second terminal and navigate to the frontend folder:
```bash
cd guyAI/frontend
```
-  Install dependencies (first time only):
```bash
npm install
```

-  Start the development server:
```bash
npm run dev
```

-  Click the `localhost` link that appears to open the app in your browser.
