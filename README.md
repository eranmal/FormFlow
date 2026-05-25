# 📝 FormFlow

[![Live Demo](https://img.shields.io/badge/Live_Demo-formflow--app.onrender.com-blue?style=for-the-badge)](https://formflow-app.onrender.com/)

FormFlow is an AI-powered document filling assistant that transforms messy, unstructured thoughts or speech into a perfectly formatted PDF. Speak or type your answers naturally, and FormFlow will analyze the PDF, synthesize your input into a highly professional format, and map it directly onto the document.

Designed with robust multilingual support, FormFlow features flawless Right-to-Left (RTL) formatting for Hebrew documents, ensuring punctuation, line wrapping, and sentence structure are always perfect.

---

## ✨ Features

- 🧠 **AI Document Analysis:** Automatically detects and extracts free-text fields from any uploaded PDF using Gemini 2.5 Flash.
- 🗣️ **Unstructured Input:** Use the native Web Speech API to speak your answers or simply type a stream of consciousness.
- 🖋️ **Professional Synthesis:** The AI rewrites your raw input into highly formal, official language perfectly suited for legal or government forms.
- 🌍 **Flawless Hebrew (RTL) Support:** Custom built PDF rendering ensures that Hebrew text flows perfectly top-to-bottom and right-to-left without any backwards sentences or missing characters (tofu).
- 🖱️ **Visual Mapping:** An intuitive drag-and-drop UI to draw bounding boxes exactly where you want the synthesized text to appear on the PDF.
- 🔐 **Bring Your Own Key (BYOK):** Client-side Gemini API key integration so your backend remains completely stateless and secure.

---

## 🚀 Getting Started

### Live Demo
You can try the live version of FormFlow instantly without downloading anything:
🔗 **[https://formflow-app.onrender.com/](https://formflow-app.onrender.com/)**

*(Note: You will still need to provide your own Gemini API Key via the settings menu).*

### Prerequisites (For Local Development)

Ensure you have the following installed on your machine:
- **Docker** and **Docker Compose**
- A **Google Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/))

### Running Locally (Docker)

The absolute easiest way to run FormFlow is using Docker Compose, which handles both the React frontend and FastAPI backend automatically.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/FormFlow.git
   cd FormFlow
   ```

2. **Spin up the containers:**
   ```bash
   docker-compose up --build
   ```

3. **Open the App:**
   Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

4. **Add your API Key:**
   When the app loads, click the "Settings" button in the top right to securely enter your Gemini API Key. It is stored locally in your browser.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind-like custom CSS (Glassmorphism), Lucide React, React-PDF
- **Backend:** Python, FastAPI, Uvicorn, Google GenAI SDK
- **PDF Engine:** PyMuPDF (`fitz`), `python-bidi` for RTL processing
- **Containerization:** Docker (Multi-stage builds)

---

## 📝 Important Notes

- **Table Support:** To optimize API costs and token usage, FormFlow intentionally ignores tables, checkbox grids, and matrices. These must be filled manually outside of the app.
- **Font Downloads:** On first startup, the backend automatically downloads the Google *Assistant* font to ensure all punctuation and Hebrew characters render perfectly.

---

## 🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License
This project is licensed under the MIT License.
