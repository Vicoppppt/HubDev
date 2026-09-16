# 🚀 DevHub - Hub de Gestion de Programmes & .env

DevHub est votre application locale dédiée à la gestion, la création et la configuration de tous vos projets dans le dossier `C:\Users\kuchp\Programmes`.

## 🌟 Fonctionnalités Clés

- **Tableau de Bord Centralisé** : Affiche automatiquement tous les dossiers de projets créés dans `Programmes` avec leur type (Node.js, Express, Python, FastAPI, React/Vite, etc.), la branche Git active et le statut des commits.
- **Gestionnaire Avancé de `.env`** :
  - Visualisation des variables sous forme de formulaire ou en mode texte brut.
  - Masquage / affichage instantané des mots de passe, tokens et clés secrètes avec bouton œil.
  - Copie rapide des valeurs dans le presse-papier.
  - **Générateur magique `.env.example`** : crée en 1 clic un `.env.example` avec vos clés nettoyées de tout secret pour Git.
  - Sauvegarde automatique de sécurité (`.env.backup`) avant chaque modification.
  - Support de fichiers multiples (`.env`, `.env.local`, `.env.production`, etc.).
- **Création de Projets en 1 Clic (Templates)** :
  - **Projet Vide**
  - **Node.js & Express API**
  - **Python (Script / App)**
  - **Python FastAPI**
  - **Frontend React & Tailwind (Vite)**
  - **Site Web Statique (HTML/CSS/JS)**
  - Initialisation Git automatique (`git init`) et `.gitignore` prêt à l'emploi.
- **Intégrations Windows Rapides** :
  - 🚀 **VS Code** : Ouvrir directement le projet dans VS Code (`code .`).
  - 💻 **Terminal** : Ouvrir une fenêtre Windows Terminal / PowerShell dans le dossier.
  - 📁 **Explorateur** : Ouvrir l'explorateur de fichiers Windows.

## 🏁 Démarrage Rapide

### Méthode 1 (Le plus simple) :
Double-cliquez sur le fichier `Start-Hub.bat` situé dans `C:\Users\kuchp\Programmes`. Le serveur démarre et votre navigateur s'ouvre automatiquement sur `http://localhost:3456`.

### Méthode 2 (Ligne de commande) :
```bash
cd C:\Users\kuchp\Programmes\project-hub
npm start
```
Puis ouvrez votre navigateur sur `http://localhost:3456`.
