// Templates definition for new projects
export const TEMPLATES = [
  {
    id: 'empty',
    name: 'Projet Vide',
    category: 'Général',
    description: 'Dossier vierge avec .gitignore et README.md initialisés.',
    icon: 'Folder',
    files: (projectName) => ({
      'README.md': `# ${projectName}\n\nProjet créé avec DevHub.\n`,
      '.gitignore': `node_modules/\n__pycache__/\n*.pyc\n.env\n.env.local\n*.log\n.DS_Store\nThumbs.db\n`,
      '.env': `# Variables d'environnement pour ${projectName}\nAPP_NAME="${projectName}"\nENVIRONMENT="development"\n`,
      '.env.example': `# Variables d'environnement exemples (sans secrets)\nAPP_NAME="${projectName}"\nENVIRONMENT="development"\n`,
    }),
  },
  {
    id: 'node-express',
    name: 'Node.js & Express API',
    category: 'Node.js',
    description: 'API REST Express avec configuration ESM, dotenv, CORS et scripts de démarrage.',
    icon: 'Server',
    files: (projectName) => ({
      'package.json': JSON.stringify({
        name: projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        version: '1.0.0',
        type: 'module',
        main: 'src/index.js',
        scripts: {
          start: 'node src/index.js',
          dev: 'node --watch src/index.js',
        },
        dependencies: {
          express: '^4.21.2',
          dotenv: '^16.4.7',
          cors: '^2.8.5',
        },
      }, null, 2),
      'src/index.js': `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\\'API ${projectName} !',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 Serveur démarré sur http://localhost:\${PORT}\`);
});
`,
      '.env': `# Configuration de ${projectName}\nPORT=3000\nNODE_ENV="development"\nAPI_KEY="secret-key-change-me"\n`,
      '.env.example': `# Configuration de ${projectName} (Exemple)\nPORT=3000\nNODE_ENV="development"\nAPI_KEY="your-api-key"\n`,
      '.gitignore': `node_modules/\n.env\n.env.local\n*.log\n.DS_Store\nThumbs.db\n`,
      'README.md': `# ${projectName}\n\nAPI REST développée avec Express.js.\n\n## Démarrage\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
    }),
  },
  {
    id: 'python-script',
    name: 'Python (Script / App)',
    category: 'Python',
    description: 'Structure Python standard avec support python-dotenv et virtualenv.',
    icon: 'Terminal',
    files: (projectName) => ({
      'main.py': `import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def main():
    app_name = os.getenv("APP_NAME", "${projectName}")
    debug = os.getenv("DEBUG", "False")
    print(f"✨ Lancement de {app_name}...")
    print(f"🔧 Mode Debug: {debug}")
    print("🚀 Prêt à coder !")

if __name__ == "__main__":
    main()
`,
      'requirements.txt': `python-dotenv>=1.0.1\nrequests>=2.32.3\n`,
      '.env': `APP_NAME="${projectName}"\nDEBUG=True\nSECRET_KEY="change-this-secret"\n`,
      '.env.example': `APP_NAME="${projectName}"\nDEBUG=False\nSECRET_KEY="your-secret-key-here"\n`,
      '.gitignore': `__pycache__/\n*.py[cod]\n*$py.class\nvenv/\n.venv/\n.env\n.env.local\n*.log\n`,
      'README.md': `# ${projectName}\n\nProjet Python avec dotenv.\n\n## Installation\n\`\`\`bash\npython -m venv .venv\n.venv\\Scripts\\activate\npip install -r requirements.txt\npython main.py\n\`\`\`\n`,
    }),
  },
  {
    id: 'python-fastapi',
    name: 'Python FastAPI',
    category: 'Python',
    description: 'API moderne haute performance avec FastAPI, Uvicorn et documentation interactive /docs.',
    icon: 'Zap',
    files: (projectName) => ({
      'main.py': `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="${projectName}",
    description="API créée avec FastAPI et DevHub",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Bienvenue sur l'API ${projectName}",
        "docs": "/docs",
        "env": os.getenv("ENVIRONMENT", "development")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
`,
      'requirements.txt': `fastapi>=0.115.0\nuvicorn[standard]>=0.32.0\npython-dotenv>=1.0.1\npydantic>=2.9.0\n`,
      '.env': `PORT=8000\nENVIRONMENT="development"\nSECRET_TOKEN="your-super-secret-token"\n`,
      '.env.example': `PORT=8000\nENVIRONMENT="development"\nSECRET_TOKEN="your-token-here"\n`,
      '.gitignore': `__pycache__/\n*.py[cod]\nvenv/\n.venv/\n.env\n.env.local\n*.log\n`,
      'README.md': `# ${projectName} - FastAPI\n\nAPI haute performance avec FastAPI.\n\n## Démarrage\n\`\`\`bash\npython -m venv .venv\n.venv\\Scripts\\activate\npip install -r requirements.txt\npython main.py\n\`\`\`\nDocumentation Swagger disponible sur: http://127.0.0.1:8000/docs\n`,
    }),
  },
  {
    id: 'vite-react',
    name: 'Frontend React + Tailwind',
    category: 'Frontend',
    description: 'Application React ultra-rapide propulsée par Vite.',
    icon: 'Layout',
    files: (projectName) => ({
      'package.json': JSON.stringify({
        name: projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
          'lucide-react': '^0.468.0',
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.3.4',
          vite: '^6.0.3',
        },
      }, null, 2),
      'index.html': `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
      'src/main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      'src/App.jsx': `import React from 'react';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', textAlign: 'center' }}>
      <h1>✨ ${projectName}</h1>
      <p>Prêt à développer avec React & Vite !</p>
    </div>
  );
}
`,
      'vite.config.js': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
      '.env': `VITE_APP_TITLE="${projectName}"\nVITE_API_URL="http://localhost:3000/api"\n`,
      '.env.example': `VITE_APP_TITLE="${projectName}"\nVITE_API_URL="http://localhost:3000/api"\n`,
      '.gitignore': `node_modules/\ndist/\n.env.local\n.env\n*.log\n`,
      'README.md': `# ${projectName}\n\nFrontend React propulsé par Vite.\n\n## Démarrage\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
    }),
  },
  {
    id: 'static-web',
    name: 'Site Web Statique (HTML/CSS/JS)',
    category: 'Frontend',
    description: 'Structure simple et propre sans outils de build, idéale pour prototyper rapidement.',
    icon: 'Globe',
    files: (projectName) => ({
      'index.html': `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="container">
    <h1>🚀 ${projectName}</h1>
    <p>Votre nouveau projet statique est prêt !</p>
    <button id="btnClick">Cliquez-moi</button>
  </main>
  <script src="script.js"></script>
</body>
</html>
`,
      'style.css': `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.container {
  text-align: center;
  padding: 2.5rem;
  background: #1e293b;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}
h1 { margin-bottom: 1rem; color: #38bdf8; }
p { margin-bottom: 1.5rem; color: #94a3b8; }
button {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
button:hover { opacity: 0.9; }
`,
      'script.js': `document.getElementById('btnClick').addEventListener('click', () => {
  alert('Bravo ! Le projet ${projectName} fonctionne parfaitement.');
});
`,
      'README.md': `# ${projectName}\n\nSite statique HTML5, CSS3, JavaScript.\n\nOuvrez simplement \`index.html\` dans votre navigateur !\n`,
      '.gitignore': `.env\n*.log\n.DS_Store\nThumbs.db\n`,
    }),
  }
];
