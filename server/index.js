import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import util from 'util';
import { TEMPLATES } from './templates.js';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3456;

// Target directory to manage: C:\Users\kuchp\Programmes
const ROOT_DIR = process.env.PROGRAMMES_DIR || path.resolve(__dirname, '..', '..');
const CURRENT_APP_FOLDER = path.basename(path.resolve(__dirname, '..'));

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Global config file for project-hub (stores GitHub Token, preferences)
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

async function loadConfig() {
  if (existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(await fs.readFile(CONFIG_FILE, 'utf-8'));
    } catch {}
  }
  return { githubToken: '', githubUsername: '', githubAvatar: '' };
}

async function saveConfig(cfg) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}

// In-memory Process Registry for running servers
// Map<projectName, ProcessInfo>
const runningProcesses = new Map();

// Helper: check if a path is safely inside ROOT_DIR
function getSafeProjectPath(projectName) {
  if (!projectName || typeof projectName !== 'string') {
    throw new Error('Nom de projet invalide');
  }
  const cleanName = path.basename(projectName);
  if (cleanName !== projectName || cleanName === '.' || cleanName === '..') {
    throw new Error('Nom de projet non autorisé');
  }
  return path.join(ROOT_DIR, cleanName);
}

// Helper: determine project type
async function detectProjectType(projectPath) {
  const types = [];

  const hasPkg = existsSync(path.join(projectPath, 'package.json'));
  if (hasPkg) {
    try {
      const pkgContent = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));
      const allDeps = {
        ...(pkgContent.dependencies || {}),
        ...(pkgContent.devDependencies || {}),
      };

      if (allDeps['next']) types.push('Next.js');
      else if (allDeps['vite']) types.push('Vite');
      else if (allDeps['react']) types.push('React');
      else if (allDeps['vue']) types.push('Vue');
      else if (allDeps['express']) types.push('Express');
      else if (!existsSync(path.join(projectPath, 'requirements.txt')) && !existsSync(path.join(projectPath, '.venv'))) types.push('Node.js');
    } catch {
      if (!existsSync(path.join(projectPath, 'requirements.txt')) && !existsSync(path.join(projectPath, '.venv'))) types.push('Node.js');
    }
  }

  let rootEntries = [];
  try {
    rootEntries = await fs.readdir(projectPath);
  } catch {}

  const hasPython = existsSync(path.join(projectPath, 'requirements.txt')) ||
                    existsSync(path.join(projectPath, '.system', 'requirements.txt')) ||
                    existsSync(path.join(projectPath, '.venv')) ||
                    existsSync(path.join(projectPath, 'pyproject.toml')) ||
                    existsSync(path.join(projectPath, 'main.py')) ||
                    existsSync(path.join(projectPath, 'run_quiz.py')) ||
                    rootEntries.some(f => f.endsWith('.py') || f.endsWith('.ipynb'));

  if (hasPython) {
    try {
      let isFastApi = false;
      let isJupyter = existsSync(path.join(projectPath, '.venv', 'Scripts', 'jupyter-lab.exe'));
      let isAi = /artificial intelligence|\bai\b|machine learning/i.test(path.basename(projectPath));
      let isQuiz = existsSync(path.join(projectPath, 'run_quiz.py')) || existsSync(path.join(projectPath, 'quiz'));

      if (existsSync(path.join(projectPath, 'requirements.txt'))) {
        const reqs = await fs.readFile(path.join(projectPath, 'requirements.txt'), 'utf-8');
        if (reqs.includes('fastapi')) isFastApi = true;
        if (reqs.includes('jupyter')) isJupyter = true;
        if (/scikit|torch|tensorflow|keras/i.test(reqs)) isAi = true;
      }
      if (existsSync(path.join(projectPath, '.system', 'requirements.txt'))) {
        const reqs = await fs.readFile(path.join(projectPath, '.system', 'requirements.txt'), 'utf-8');
        if (reqs.includes('fastapi')) isFastApi = true;
        if (reqs.includes('jupyter')) isJupyter = true;
        if (/scikit|torch|tensorflow|keras/i.test(reqs)) isAi = true;
      }

      types.push('Python');
      if (isAi) types.push('AI');
      if (isFastApi) types.push('FastAPI');
      if (isJupyter) types.push('Jupyter');
      if (isQuiz) types.push('QCM');
    } catch {
      types.push('Python');
    }
  }

  if (existsSync(path.join(projectPath, 'Cargo.toml'))) types.push('Rust');
  if (existsSync(path.join(projectPath, 'go.mod'))) types.push('Go');

  // Detect database stacks (PostgreSQL, MongoDB)
  const isDbProject = /database/i.test(path.basename(projectPath)) || existsSync(path.join(projectPath, 'bin', 'postgres')) || existsSync(path.join(projectPath, 'bin', 'mongo'));
  if (isDbProject) {
    types.push('PostgreSQL');
    types.push('MongoDB');
  }

  if (types.length === 0 && existsSync(path.join(projectPath, 'index.html'))) types.push('HTML/Web');

  if (types.length === 0) types.push('Général');
  return types;
}

// Helper: detect port from .env
function detectConfiguredPort(projectPath) {
  const envFiles = ['.env', '.env.local', '.env.development'];
  for (const f of envFiles) {
    const p = path.join(projectPath, f);
    if (existsSync(p)) {
      try {
        const content = readFileSync(p, 'utf-8');
        const match = content.match(/^\s*PORT\s*=\s*"?(\d+)"?/m);
        if (match) return parseInt(match[1], 10);
      } catch {}
    }
  }
  return null;
}

// Helper: format GitHub web URL from git remote
function formatGithubUrl(remoteUrl) {
  if (!remoteUrl) return null;
  const clean = remoteUrl.trim();
  const match = clean.match(/(?:git@github\.com:|https?:\/\/github\.com\/)([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i);
  if (match) {
    return `https://github.com/${match[1]}/${match[2]}`;
  }
  return null;
}

// Helper: read git info safely
async function getGitInfo(projectPath) {
  const gitDir = path.join(projectPath, '.git');
  if (!existsSync(gitDir)) {
    return { initialized: false, hasRemote: false, isClean: true, changesCount: 0 };
  }

  try {
    let branch = 'main';
    try {
      const { stdout: b } = await execPromise('git branch --show-current', { cwd: projectPath, timeout: 3000 });
      if (b.trim()) branch = b.trim();
    } catch {}

    let status = '';
    try {
      const { stdout: s } = await execPromise('git status --porcelain', { cwd: projectPath, timeout: 3000 });
      status = s.trim();
    } catch {}

    let remoteUrl = null;
    try {
      const { stdout: r } = await execPromise('git config --get remote.origin.url', { cwd: projectPath, timeout: 3000 });
      remoteUrl = r.trim() || null;
    } catch {}

    const dirty = status.length > 0;
    const changesCount = dirty ? status.split('\n').length : 0;

    return {
      initialized: true,
      branch,
      isClean: !dirty,
      changesCount,
      remoteUrl,
      githubUrl: formatGithubUrl(remoteUrl),
      hasRemote: Boolean(remoteUrl),
    };
  } catch (err) {
    return { initialized: true, branch: 'main', isClean: true, changesCount: 0, remoteUrl: null, hasRemote: false };
  }
}

// Helper: get list of .env* files
async function listEnvFiles(projectPath) {
  try {
    const files = await fs.readdir(projectPath);
    return files.filter(f => f.startsWith('.env'));
  } catch {
    return [];
  }
}

// Helper: parse .env content
function parseEnvContent(raw) {
  const lines = raw.split(/\r?\n/);
  const items = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      items.push({ type: 'empty', raw: line, index: i });
      continue;
    }

    if (trimmed.startsWith('#')) {
      items.push({ type: 'comment', value: trimmed.replace(/^#\s?/, ''), raw: line, index: i });
      continue;
    }

    const match = line.match(/^\s*(?:export\s+)?([a-zA-Z0-9_.-]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let val = match[2];

      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      const isSecret = /secret|key|token|password|pwd|auth|credential|api_?key|private/i.test(key);

      items.push({
        type: 'pair',
        key,
        value: val,
        isSecret,
        raw: line,
        index: i,
      });
    } else {
      items.push({ type: 'unknown', raw: line, index: i });
    }
  }

  return items;
}

// Helper: serialize parsed env items back to file content
function serializeEnv(items) {
  return items.map(item => {
    if (item.type === 'empty') return '';
    if (item.type === 'comment') return `# ${item.value || ''}`;
    if (item.type === 'pair') {
      const val = item.value ?? '';
      const needsQuotes = /\s|"|'/.test(val);
      const safeVal = needsQuotes ? `"${val.replace(/"/g, '\\"')}"` : val;
      return `${item.key}=${safeVal}`;
    }
    return item.raw || '';
  }).join('\n') + '\n';
}

// Helper: determine start command for a project
function getProjectStartCommand(projectPath) {
  // Check for dedicated JupyterLab virtualenv
  const venvJupyter = path.join(projectPath, '.venv', 'Scripts', 'jupyter-lab.exe');
  const venvPython = path.join(projectPath, '.venv', 'Scripts', 'python.exe');
  if (existsSync(venvJupyter) && existsSync(venvPython)) {
    const configuredPort = detectConfiguredPort(projectPath) || 8888;
    return `"${venvPython}" -m jupyterlab --no-browser --port=${configuredPort} --ServerApp.ip=127.0.0.1 --ServerApp.token="" --ServerApp.password="" --ServerApp.disable_check_xsrf=True`;
  }

  const pkgPath = path.join(projectPath, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts && pkg.scripts.dev) return 'npm run dev';
      if (pkg.scripts && pkg.scripts.start) return 'npm start';
      if (pkg.main && existsSync(path.join(projectPath, pkg.main))) return `node ${pkg.main}`;
      if (existsSync(path.join(projectPath, 'src/index.js'))) return 'node src/index.js';
      if (existsSync(path.join(projectPath, 'index.js'))) return 'node index.js';
    } catch {}
    return 'npm start';
  }

  if (existsSync(path.join(projectPath, 'main.py'))) {
    const venvPy = path.join(projectPath, '.venv', 'Scripts', 'python.exe');
    if (existsSync(venvPy)) return `"${venvPy}" main.py`;
    return 'python main.py';
  }

  if (existsSync(path.join(projectPath, 'app.py'))) {
    return 'python app.py';
  }

  return null;
}

// GET /api/templates
app.get('/api/templates', (req, res) => {
  res.json({ templates: TEMPLATES });
});

// GET /api/system
app.get('/api/system', async (req, res) => {
  let nodeVersion = process.version;
  let pythonVersion = 'Non détecté';
  let gitVersion = 'Non détecté';
  let vsCodeAvailable = false;
  let terminalAvailable = false;

  try {
    const { stdout: py } = await execPromise('python --version', { timeout: 3000 });
    pythonVersion = py.trim();
  } catch {}

  try {
    const { stdout: git } = await execPromise('git --version', { timeout: 3000 });
    gitVersion = git.trim();
  } catch {}

  try {
    await execPromise('code -v', { timeout: 3000 });
    vsCodeAvailable = true;
  } catch {}

  try {
    await execPromise('wt -v', { timeout: 3000 });
    terminalAvailable = true;
  } catch {}

  res.json({
    rootDir: ROOT_DIR,
    nodeVersion,
    pythonVersion,
    gitVersion,
    vsCodeAvailable,
    terminalAvailable,
  });
});

// GET /api/projects
app.get('/api/projects', async (req, res) => {
  try {
    const entries = await fs.readdir(ROOT_DIR, { withFileTypes: true });
    const projects = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === CURRENT_APP_FOLDER || entry.name.startsWith('.') || entry.name.startsWith('$')) {
        continue;
      }

      const projectPath = path.join(ROOT_DIR, entry.name);

      try {
        const stats = await fs.stat(projectPath);
        const types = await detectProjectType(projectPath);
        const git = await getGitInfo(projectPath);
        const envFiles = await listEnvFiles(projectPath);
        const configuredPort = detectConfiguredPort(projectPath);

        let scripts = [];
        const pkgPath = path.join(projectPath, 'package.json');
        if (existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
            if (pkg.scripts) scripts = Object.keys(pkg.scripts);
          } catch {}
        }

        let projectEntries = [];
        try {
          projectEntries = await fs.readdir(projectPath);
        } catch {}

        const hasIndexHtml = existsSync(path.join(projectPath, 'index.html'));
        const isStaticWeb = hasIndexHtml && !existsSync(pkgPath) && !existsSync(path.join(projectPath, 'main.py'));
        const canStartServer = Boolean(getProjectStartCommand(projectPath));
        const hasPsql = existsSync(path.join(projectPath, 'psql.bat')) || existsSync(path.join(projectPath, 'bin', 'postgres'));
        const hasMongosh = existsSync(path.join(projectPath, 'mongosh.bat')) || existsSync(path.join(projectPath, 'bin', 'mongo'));
        const hasDbeaver = existsSync(path.join(projectPath, 'dbeaver.bat')) || existsSync(path.join(projectPath, 'bin', 'dbeaver', 'dbeaver.exe'));
        const isDbProject = hasPsql || hasMongosh || /database/i.test(entry.name);
        const hasQuiz = existsSync(path.join(projectPath, 'run_quiz.py')) || existsSync(path.join(projectPath, 'quiz'));
        const hasNotebooks = types.includes('Jupyter') || projectEntries.some(f => f.endsWith('.ipynb')) || existsSync(path.join(projectPath, 'Lesson 1'));

        // Process status
        const proc = runningProcesses.get(entry.name);
        const processInfo = proc ? {
          running: proc.status === 'running',
          status: proc.status,
          port: proc.port,
          url: isDbProject ? null : proc.url,
          startedAt: proc.startedAt,
          pid: proc.pid,
        } : {
          running: false,
          status: 'stopped',
          port: configuredPort,
          url: (!isDbProject && configuredPort) ? `http://localhost:${configuredPort}` : null,
        };

        projects.push({
          name: entry.name,
          path: projectPath,
          updatedAt: stats.mtime.toISOString(),
          types,
          git,
          envFiles,
          scripts,
          configuredPort,
          hasReadme: existsSync(path.join(projectPath, 'README.md')),
          hasIndexHtml,
          isStaticWeb,
          canStartServer,
          previewUrl: hasIndexHtml ? `/preview/${entry.name}/index.html` : null,
          process: processInfo,
          isDbProject,
          hasPsql,
          hasMongosh,
          hasDbeaver,
          hasQuiz,
          hasNotebooks,
        });
      } catch (err) {
        console.error(`Erreur lecture ${entry.name}:`, err.message);
      }
    }

    projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ projects, rootDir: ROOT_DIR });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/processes - Bulk process statuses
app.get('/api/processes', (req, res) => {
  const result = {};
  for (const [name, proc] of runningProcesses.entries()) {
    const isDb = existsSync(path.join(ROOT_DIR, name, 'psql.bat')) || existsSync(path.join(ROOT_DIR, name, 'mongosh.bat')) || /database/i.test(name);
    result[name] = {
      running: proc.status === 'running',
      status: proc.status,
      port: proc.port,
      url: isDb ? null : proc.url,
      startedAt: proc.startedAt,
      pid: proc.pid,
      command: proc.command,
    };
  }
  res.json({ processes: result });
});

// POST /api/projects/:name/process/start - Start project server
app.post('/api/projects/:name/process/start', async (req, res) => {
  try {
    const projectName = req.params.name;
    const projectPath = getSafeProjectPath(projectName);

    if (!existsSync(projectPath)) {
      return res.status(404).json({ error: 'Projet introuvable' });
    }

    const isDbProject = existsSync(path.join(projectPath, 'psql.bat')) || existsSync(path.join(projectPath, 'mongosh.bat')) || /database/i.test(projectName);

    // Check if already running
    const existing = runningProcesses.get(projectName);
    if (existing && existing.status === 'running') {
      return res.json({
        message: 'Serveur déjà en cours d\'exécution',
        port: existing.port,
        url: isDbProject ? null : existing.url,
        pid: existing.pid,
      });
    }

    const command = getProjectStartCommand(projectPath);
    if (!command) {
      return res.status(400).json({ error: 'Aucun script de démarrage détecté pour ce projet' });
    }

    const configuredPort = detectConfiguredPort(projectPath);

    // Initial logs array
    const logs = [
      { text: `🚀 Démarrage de ${projectName} avec la commande: ${command}`, type: 'info', time: new Date().toLocaleTimeString() }
    ];

    // If Node project and node_modules is missing, run npm install first
    const pkgPath = path.join(projectPath, 'package.json');
    if (existsSync(pkgPath) && !existsSync(path.join(projectPath, 'node_modules'))) {
      logs.push({ text: `📦 Première exécution : installation des dépendances (npm install)...`, type: 'info', time: new Date().toLocaleTimeString() });
      try {
        await execPromise('npm install', { cwd: projectPath });
        logs.push({ text: `✅ Dépendances installées avec succès !`, type: 'info', time: new Date().toLocaleTimeString() });
      } catch (installErr) {
        logs.push({ text: `⚠️ Erreur lors de npm install : ${installErr.message}`, type: 'stderr', time: new Date().toLocaleTimeString() });
      }
    }

    // Spawn process with shell: true
    const child = spawn(command, {
      cwd: projectPath,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    const procInfo = {
      pid: child.pid,
      child,
      status: 'running',
      startedAt: new Date(),
      port: configuredPort || null,
      url: (!isDbProject && configuredPort) ? `http://localhost:${configuredPort}` : null,
      command,
      logs,
      exitCode: null,
    };

    // Helper to append log
    const addLog = (text, type = 'stdout') => {
      const line = text.toString();
      procInfo.logs.push({ text: line, type, time: new Date().toLocaleTimeString() });
      if (procInfo.logs.length > 300) procInfo.logs.shift(); // keep last 300 lines

      // Try detecting port from log output
      if (!procInfo.port) {
        const urlMatch = line.match(/https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)/i);
        const portMatch = line.match(/(?:port|listening on|running at)[:\s]+(\d{3,5})/i);
        const detected = urlMatch ? parseInt(urlMatch[1], 10) : (portMatch ? parseInt(portMatch[1], 10) : null);
        if (detected) {
          procInfo.port = detected;
          if (!isDbProject) {
            procInfo.url = `http://localhost:${detected}`;
          }
        }
      }
    };

    child.stdout.on('data', (data) => addLog(data, 'stdout'));
    child.stderr.on('data', (data) => addLog(data, 'stderr'));

    child.on('error', (err) => {
      procInfo.status = 'crashed';
      addLog(`❌ Erreur: ${err.message}`, 'stderr');
    });

    child.on('close', (code) => {
      procInfo.status = 'stopped';
      procInfo.exitCode = code;
      addLog(`🛑 Processus arrêté avec le code ${code}`, 'info');
    });

    runningProcesses.set(projectName, procInfo);

    // Wait a brief moment to catch immediate port log or immediate error
    await new Promise(r => setTimeout(r, 600));

    res.json({
      message: `Serveur ${projectName} démarré avec succès`,
      status: 'running',
      pid: child.pid,
      port: procInfo.port,
      url: isDbProject ? null : (procInfo.url || (procInfo.port ? `http://localhost:${procInfo.port}` : null)),
      command,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:name/process/stop - Stop project server
app.post('/api/projects/:name/process/stop', async (req, res) => {
  try {
    const projectName = req.params.name;
    const proc = runningProcesses.get(projectName);

    if (!proc || proc.status !== 'running') {
      return res.json({ message: 'Le serveur n\'était pas en cours d\'exécution' });
    }

    // Windows kill process tree
    try {
      await execPromise(`taskkill /pid ${proc.pid} /T /F`);
    } catch (e) {
      // Fallback
      proc.child.kill('SIGKILL');
    }

    proc.status = 'stopped';
    proc.logs.push({ text: '🛑 Serveur arrêté manuellement depuis DevHub', type: 'info', time: new Date().toLocaleTimeString() });

    res.json({ message: `Serveur ${projectName} arrêté avec succès` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:name/process/status
app.get('/api/projects/:name/process/status', (req, res) => {
  const projectName = req.params.name;
  const proc = runningProcesses.get(projectName);

  if (!proc) {
    const projectPath = getSafeProjectPath(projectName);
    const configuredPort = detectConfiguredPort(projectPath);
    return res.json({
      running: false,
      status: 'stopped',
      port: configuredPort,
      url: configuredPort ? `http://localhost:${configuredPort}` : null,
    });
  }

  res.json({
    running: proc.status === 'running',
    status: proc.status,
    port: proc.port,
    url: proc.url,
    startedAt: proc.startedAt,
    pid: proc.pid,
    command: proc.command,
    logCount: proc.logs.length,
  });
});

// GET /api/projects/:name/process/logs
app.get('/api/projects/:name/process/logs', (req, res) => {
  const projectName = req.params.name;
  const proc = runningProcesses.get(projectName);

  if (!proc) {
    return res.json({ logs: [], running: false });
  }

  res.json({
    logs: proc.logs,
    running: proc.status === 'running',
    port: proc.port,
    url: proc.url,
    pid: proc.pid,
  });
});

// Static preview route for any project
// e.g. /preview/my-static-site/ or /preview/my-static-site/index.html
app.use('/preview/:name', (req, res, next) => {
  try {
    const projectName = req.params.name;
    const projectPath = getSafeProjectPath(projectName);
    if (!existsSync(projectPath)) {
      return res.status(404).send('Projet introuvable');
    }
    // Remove /preview/:name from url and serve static
    express.static(projectPath)(req, res, next);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST /api/projects - Create project
app.post('/api/projects', async (req, res) => {
  try {
    const { name, templateId = 'empty', initGit = true, customEnv = {} } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom du projet est requis' });
    }

    const cleanName = name.trim();
    const projectPath = getSafeProjectPath(cleanName);

    if (existsSync(projectPath)) {
      return res.status(400).json({ error: `Le dossier "${cleanName}" existe déjà` });
    }

    await fs.mkdir(projectPath, { recursive: true });

    const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
    const files = template.files(cleanName);

    for (const [relPath, content] of Object.entries(files)) {
      const fullPath = path.join(projectPath, relPath);
      const parentDir = path.dirname(fullPath);
      if (!existsSync(parentDir)) {
        await fs.mkdir(parentDir, { recursive: true });
      }
      await fs.writeFile(fullPath, content, 'utf-8');
    }

    if (customEnv && Object.keys(customEnv).length > 0) {
      const envPath = path.join(projectPath, '.env');
      let currentEnv = existsSync(envPath) ? await fs.readFile(envPath, 'utf-8') : '';
      currentEnv += '\n# Variables personnalisées ajoutées à la création\n';
      for (const [k, v] of Object.entries(customEnv)) {
        currentEnv += `${k}="${v}"\n`;
      }
      await fs.writeFile(envPath, currentEnv, 'utf-8');
    }

    if (initGit) {
      try {
        await execPromise('git init', { cwd: projectPath });
      } catch (err) {
        console.warn('Git init non effectué:', err.message);
      }
    }

    res.status(201).json({
      message: `Projet "${cleanName}" créé avec succès`,
      name: cleanName,
      path: projectPath,
      template: template.name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/projects/:name
app.delete('/api/projects/:name', async (req, res) => {
  try {
    const projectName = req.params.name;
    const projectPath = getSafeProjectPath(projectName);
    if (!existsSync(projectPath)) {
      return res.status(404).json({ error: 'Projet introuvable' });
    }

    // Stop process if running
    const proc = runningProcesses.get(projectName);
    if (proc && proc.status === 'running') {
      try {
        await execPromise(`taskkill /pid ${proc.pid} /T /F`);
      } catch {}
      runningProcesses.delete(projectName);
    }

    await fs.rm(projectPath, { recursive: true, force: true });
    res.json({ message: `Projet ${projectName} supprimé avec succès` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:name/env
app.get('/api/projects/:name/env', async (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const filename = req.query.file || '.env';

    if (path.basename(filename) !== filename || !filename.startsWith('.env')) {
      return res.status(400).json({ error: 'Nom de fichier d\'environnement invalide' });
    }

    const filePath = path.join(projectPath, filename);
    const exists = existsSync(filePath);
    const raw = exists ? await fs.readFile(filePath, 'utf-8') : '';
    const parsed = parseEnvContent(raw);
    const allEnvFiles = await listEnvFiles(projectPath);

    res.json({
      projectName: req.params.name,
      filename,
      exists,
      raw,
      parsed,
      allEnvFiles,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:name/env
app.post('/api/projects/:name/env', async (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const { filename = '.env', mode = 'raw', raw, items } = req.body;

    if (path.basename(filename) !== filename || !filename.startsWith('.env')) {
      return res.status(400).json({ error: 'Nom de fichier .env invalide' });
    }

    const filePath = path.join(projectPath, filename);

    if (existsSync(filePath)) {
      const backupPath = path.join(projectPath, `${filename}.backup`);
      await fs.copyFile(filePath, backupPath);
    }

    let finalContent = '';
    if (mode === 'parsed' && Array.isArray(items)) {
      finalContent = serializeEnv(items);
    } else {
      finalContent = raw || '';
    }

    await fs.writeFile(filePath, finalContent, 'utf-8');

    res.json({
      message: `Fichier ${filename} enregistré avec succès`,
      filename,
      raw: finalContent,
      parsed: parseEnvContent(finalContent),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:name/env/generate-example
app.post('/api/projects/:name/env/generate-example', async (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const { source = '.env', target = '.env.example' } = req.body;

    const srcPath = path.join(projectPath, source);
    if (!existsSync(srcPath)) {
      return res.status(404).json({ error: `Le fichier source ${source} n'existe pas` });
    }

    const raw = await fs.readFile(srcPath, 'utf-8');
    const parsed = parseEnvContent(raw);

    const exampleItems = parsed.map(item => {
      if (item.type === 'pair') {
        let dummyValue = '';
        if (item.isSecret) {
          dummyValue = 'your_' + item.key.toLowerCase() + '_here';
        } else if (/^https?:\/\//.test(item.value)) {
          dummyValue = item.value;
        } else if (/^\d+$/.test(item.value)) {
          dummyValue = item.value;
        } else {
          dummyValue = item.value;
        }
        return { ...item, value: dummyValue };
      }
      return item;
    });

    const exampleContent = `# Fichier d'exemple généré automatiquement par DevHub\n` + serializeEnv(exampleItems);
    const targetPath = path.join(projectPath, target);
    await fs.writeFile(targetPath, exampleContent, 'utf-8');

    res.json({
      message: `Fichier ${target} généré avec succès`,
      filename: target,
      raw: exampleContent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Open VS Code
app.post('/api/projects/:name/actions/open-code', (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    spawn('cmd.exe', ['/c', 'code', projectPath], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    res.json({ message: 'Ouverture de VS Code lancée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Open Explorer
app.post('/api/projects/:name/actions/open-explorer', (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    spawn('explorer.exe', [projectPath], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    res.json({ message: 'Explorateur ouvert' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Open Terminal
app.post('/api/projects/:name/actions/open-terminal', (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    spawn('powershell.exe', ['-Command', `Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', 'Set-Location \\"${projectPath}\\"'`], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    res.json({ message: 'Terminal ouvert' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Launch psql interactive CLI
app.post('/api/projects/:name/actions/launch-psql', (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const psqlBat = path.join(projectPath, 'psql.bat');

    if (!existsSync(psqlBat)) {
      return res.status(404).json({ error: 'psql.bat introuvable dans ce projet' });
    }

    spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', 'psql.bat'], {
      cwd: projectPath,
      detached: true,
      stdio: 'ignore',
    }).unref();

    res.json({ message: 'Console psql lancée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Launch mongosh interactive CLI
app.post('/api/projects/:name/actions/launch-mongosh', (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const mongoshBat = path.join(projectPath, 'mongosh.bat');

    if (!existsSync(mongoshBat)) {
      return res.status(404).json({ error: 'mongosh.bat introuvable dans ce projet' });
    }

    spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', 'mongosh.bat'], {
      cwd: projectPath,
      detached: true,
      stdio: 'ignore',
    }).unref();

    res.json({ message: 'Console mongosh lancée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Launch DBeaver Community (Portable & Isolated workspace)
app.post('/api/projects/:name/actions/launch-dbeaver', (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const dbeaverExe = path.join(projectPath, 'bin', 'dbeaver', 'dbeaver.exe');
    const dbeaverBat = path.join(projectPath, 'dbeaver.bat');
    const workspaceDir = path.join(projectPath, 'data', 'dbeaver-workspace');

    if (!existsSync(dbeaverExe) && !existsSync(dbeaverBat)) {
      return res.status(404).json({ error: 'DBeaver portable introuvable dans ce projet' });
    }

    if (!existsSync(workspaceDir)) {
      fsSync.mkdirSync(workspaceDir, { recursive: true });
    }

    spawn('cmd.exe', ['/c', 'start', 'dbeaver.bat'], {
      cwd: projectPath,
      detached: true,
      stdio: 'ignore',
    }).unref();

    res.json({ message: 'DBeaver Community lancé (espace isolé)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Launch Interactive Python Quiz (run_quiz.py)
app.post('/api/projects/:name/actions/launch-quiz', (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const quizScript = path.join(projectPath, 'run_quiz.py');

    if (!existsSync(quizScript)) {
      return res.status(404).json({ error: 'run_quiz.py introuvable dans ce projet' });
    }

    spawn('powershell.exe', ['-Command', `Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', 'Set-Location \\"${projectPath}\\"; python run_quiz.py'`], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    res.json({ message: 'QCM interactif lancé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Launch JupyterLab for notebooks (using dedicated venv if present, or shared venv)
app.post('/api/projects/:name/actions/launch-jupyter', (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const sharedVenvPy = 'c:\\Users\\kuchp\\Programmes\\ISEN - 4 - Python Scripting\\.venv\\Scripts\\python.exe';
    const localVenvPy = path.join(projectPath, '.venv', 'Scripts', 'python.exe');

    let pyExec = existsSync(localVenvPy) ? localVenvPy : (existsSync(sharedVenvPy) ? sharedVenvPy : 'python');
    const jupyterArgs = `-m jupyterlab --ServerApp.token=\\"\\" --ServerApp.password=\\"\\" --ServerApp.disable_check_xsrf=True`;

    spawn('powershell.exe', ['-Command', `Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', 'Set-Location \\"${projectPath}\\"; & \\"${pyExec}\\" ${jupyterArgs}'`], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    res.json({ message: 'JupyterLab lancé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:name/git/status - Detailed Git status
app.get('/api/projects/:name/git/status', async (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const gitInfo = await getGitInfo(projectPath);

    let changes = [];
    let commits = [];

    if (gitInfo.initialized) {
      try {
        const { stdout: s } = await execPromise('git status --porcelain', { cwd: projectPath, timeout: 3000 });
        if (s.trim()) {
          changes = s.trim().split('\n').map(line => {
            const state = line.substring(0, 2).trim();
            const file = line.substring(3).trim();
            return { state, file };
          });
        }
      } catch {}

      try {
        const { stdout: log } = await execPromise('git log -n 5 --pretty=format:"%h - %s (%cr)"', { cwd: projectPath, timeout: 3000 });
        if (log.trim()) {
          commits = log.trim().split('\n').map(c => c.replace(/^"|"$/g, ''));
        }
      } catch {}
    }

    res.json({
      ...gitInfo,
      changes,
      commits,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:name/git/set-remote - Set or update GitHub remote
app.post('/api/projects/:name/git/set-remote', async (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const { remoteUrl } = req.body;

    if (!remoteUrl || !remoteUrl.trim()) {
      return res.status(400).json({ error: 'URL du dépôt GitHub requise' });
    }

    const cleanUrl = remoteUrl.trim();

    // Init git if not initialized
    const gitDir = path.join(projectPath, '.git');
    if (!existsSync(gitDir)) {
      await execPromise('git init', { cwd: projectPath });
    }

    // Ensure branch is main
    try {
      await execPromise('git branch -M main', { cwd: projectPath });
    } catch {}

    // Remove existing origin if present
    try {
      await execPromise('git remote remove origin', { cwd: projectPath });
    } catch {}

    // Add new origin
    await execPromise(`git remote add origin "${cleanUrl}"`, { cwd: projectPath });

    const githubUrl = formatGithubUrl(cleanUrl);

    res.json({
      message: 'Dépôt GitHub configuré avec succès',
      remoteUrl: cleanUrl,
      githubUrl,
      branch: 'main',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:name/git/push - 1-Click Push on main
app.post('/api/projects/:name/git/push', async (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const { message, remoteUrl } = req.body;

    // 1. If remoteUrl is passed, set it
    if (remoteUrl && remoteUrl.trim()) {
      try {
        await execPromise('git remote remove origin', { cwd: projectPath });
      } catch {}
      await execPromise(`git remote add origin "${remoteUrl.trim()}"`, { cwd: projectPath });
    }

    // 2. Check if git is initialized
    const gitDir = path.join(projectPath, '.git');
    if (!existsSync(gitDir)) {
      await execPromise('git init', { cwd: projectPath });
    }

    // 3. Ensure branch is main
    try {
      await execPromise('git branch -M main', { cwd: projectPath });
    } catch {}

    // 4. Secure .env: Ensure .gitignore protects all secret files and backups
    const gitignorePath = path.join(projectPath, '.gitignore');
    let gitignore = existsSync(gitignorePath) ? await fs.readFile(gitignorePath, 'utf-8') : '';
    let updatedGitignore = false;
    if (!gitignore.includes('.env')) {
      gitignore += '\n.env\n.env.local\n.env.*.local\n';
      updatedGitignore = true;
    }
    if (!gitignore.includes('*.backup')) {
      gitignore += '\n*.backup\n';
      updatedGitignore = true;
    }
    if (updatedGitignore) {
      await fs.writeFile(gitignorePath, gitignore, 'utf-8');
    }

    // Untrack .env and backups if accidentally tracked previously
    try {
      await execPromise('git rm --cached .env .env.local *.backup -f', { cwd: projectPath });
    } catch {}

    // 5. Check if remote exists
    let activeRemote = null;
    try {
      const { stdout: r } = await execPromise('git config --get remote.origin.url', { cwd: projectPath });
      activeRemote = r.trim() || null;
    } catch {}

    if (!activeRemote) {
      return res.status(400).json({
        needRemote: true,
        error: 'Aucun dépôt GitHub distant configuré pour ce projet.',
        message: 'Veuillez renseigner l\'URL de votre dépôt GitHub (ex: https://github.com/vico/mon-projet.git)',
      });
    }

    // 6. Stage all changes
    await execPromise('git add .', { cwd: projectPath });

    // 7. Commit changes if any
    const commitMessage = message && message.trim() 
      ? message.trim() 
      : `Auto-sync DevHub: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`;

    let didCommit = false;
    try {
      await execPromise(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: projectPath });
      didCommit = true;
    } catch (commitErr) {
      // If nothing to commit, commitErr occurs, which is fine if we still need to push unpushed commits
    }

    // 8. Push to GitHub on main (injecting token if available for private repo access)
    let pushOutput = '';
    const config = await loadConfig();
    const githubToken = config.githubToken;
    let pushTarget = 'origin';

    if (githubToken && activeRemote.startsWith('https://github.com/')) {
      if (!activeRemote.includes('@')) {
        pushTarget = activeRemote.replace('https://', `https://${githubToken.trim()}@`);
      } else {
        pushTarget = activeRemote;
      }
    }

    try {
      const { stdout, stderr } = await execPromise(`git push -u "${pushTarget}" main`, { cwd: projectPath, timeout: 35000 });
      pushOutput = stdout + stderr;
    } catch (pushErr) {
      // If branch is master instead of main, try pushing current HEAD
      try {
        const { stdout, stderr } = await execPromise(`git push -u "${pushTarget}" HEAD:main`, { cwd: projectPath, timeout: 35000 });
        pushOutput = stdout + stderr;
      } catch (fallbackErr) {
        const combinedMsg = (fallbackErr.message || '') + (fallbackErr.stderr || '') + (pushErr.message || '') + (pushErr.stderr || '');
        if (/not found|Repository not found/i.test(combinedMsg)) {
          return res.status(404).json({
            notFound: true,
            needCreation: true,
            error: 'Le dépôt distant est introuvable sur GitHub.',
            message: 'Le dépôt n\'existe pas encore sur votre compte GitHub. Souhaitez-vous le créer en 1 clic ?',
            projectName: req.params.name,
          });
        }
        throw new Error(`Échec du push GitHub : ${fallbackErr.message || pushErr.message}`);
      }
    }

    const githubUrl = formatGithubUrl(activeRemote);

    res.json({
      success: true,
      message: '🎉 Push sur GitHub réussi avec succès !',
      commitMessage: didCommit ? commitMessage : 'Déjà à jour (aucun nouveau commit nécessaire)',
      githubUrl,
      branch: 'main',
      output: pushOutput,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:name/git/pull - Pull from GitHub
app.post('/api/projects/:name/git/pull', async (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    const config = await loadConfig();
    const githubToken = config.githubToken;

    let activeRemote = null;
    try {
      const { stdout: r } = await execPromise('git config --get remote.origin.url', { cwd: projectPath });
      activeRemote = r.trim() || null;
    } catch {}

    if (!activeRemote) {
      return res.status(400).json({ error: 'Aucun dépôt GitHub distant configuré pour ce projet.' });
    }

    let pullTarget = 'origin';
    if (githubToken && activeRemote.startsWith('https://github.com/')) {
      if (!activeRemote.includes('@')) {
        pullTarget = activeRemote.replace('https://', `https://${githubToken.trim()}@`);
      } else {
        pullTarget = activeRemote;
      }
    }

    // Detect current branch
    let currentBranch = 'main';
    try {
      const { stdout: b } = await execPromise('git rev-parse --abbrev-ref HEAD', { cwd: projectPath });
      if (b.trim() && b.trim() !== 'HEAD') currentBranch = b.trim();
    } catch {}

    let pullOutput = '';
    try {
      const { stdout, stderr } = await execPromise(`git pull "${pullTarget}" ${currentBranch}`, { cwd: projectPath, timeout: 35000 });
      pullOutput = stdout + (stderr ? '\n' + stderr : '');
    } catch (pullErr) {
      // Fallback to git pull without branch or main
      try {
        const { stdout, stderr } = await execPromise(`git pull "${pullTarget}"`, { cwd: projectPath, timeout: 35000 });
        pullOutput = stdout + (stderr ? '\n' + stderr : '');
      } catch (fallbackErr) {
        throw new Error(fallbackErr.stderr || fallbackErr.message || pullErr.message);
      }
    }

    res.json({
      success: true,
      message: '🎉 Dépôt synchronisé depuis GitHub avec succès !',
      output: pullOutput.trim() || 'Already up to date.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:name/git/remove-remote - Dissociate origin
app.post('/api/projects/:name/git/remove-remote', async (req, res) => {
  try {
    const projectPath = getSafeProjectPath(req.params.name);
    try {
      await execPromise('git remote remove origin', { cwd: projectPath });
    } catch {}
    res.json({ message: 'Remote origin dissocié avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/github/config - Check GitHub token status
app.get('/api/github/config', async (req, res) => {
  const config = await loadConfig();
  res.json({
    hasToken: Boolean(config.githubToken),
    username: config.githubUsername || null,
    avatarUrl: config.githubAvatar || null,
  });
});

// POST /api/github/config - Save & verify GitHub token
app.post('/api/github/config', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || !token.trim()) {
      const config = await loadConfig();
      config.githubToken = '';
      config.githubUsername = '';
      config.githubAvatar = '';
      await saveConfig(config);
      return res.json({ message: 'Token GitHub supprimé', hasToken: false });
    }

    // Verify token with GitHub
    const resp = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevHub-App',
      }
    });

    const user = await resp.json();
    if (!resp.ok) {
      return res.status(400).json({ error: user.message || 'Token GitHub invalide ou expiré' });
    }

    const config = await loadConfig();
    config.githubToken = token.trim();
    config.githubUsername = user.login;
    config.githubAvatar = user.avatar_url;
    await saveConfig(config);

    res.json({
      message: `Connecté à GitHub en tant que @${user.login}`,
      hasToken: true,
      username: user.login,
      avatarUrl: user.avatar_url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:name/git/create-github-repo - Create repo directly via GitHub API
app.post('/api/projects/:name/git/create-github-repo', async (req, res) => {
  try {
    const projectName = req.params.name;
    const projectPath = getSafeProjectPath(projectName);
    const { repoName = projectName, isPrivate = true, description, token } = req.body;

    const config = await loadConfig();
    const githubToken = token || config.githubToken;

    if (!githubToken) {
      return res.status(400).json({
        needToken: true,
        error: 'Token GitHub requis pour créer automatiquement le dépôt.',
        message: 'Veuillez renseigner votre Personal Access Token GitHub (avec la permission "repo").'
      });
    }

    // Call GitHub API to create repository
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken.trim()}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevHub-App',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName.trim(),
        private: Boolean(isPrivate),
        description: description || `Projet ${repoName} créé avec DevHub`,
        auto_init: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur GitHub API lors de la création du dépôt');
    }

    const cloneUrl = data.clone_url;
    const htmlUrl = data.html_url;

    // Save token and username if not already saved
    if (data.owner && data.owner.login) {
      config.githubToken = githubToken.trim();
      config.githubUsername = data.owner.login;
      config.githubAvatar = data.owner.avatar_url;
      await saveConfig(config);
    }

    // Configure Git in project
    const gitDir = path.join(projectPath, '.git');
    if (!existsSync(gitDir)) {
      await execPromise('git init', { cwd: projectPath });
    }

    try {
      await execPromise('git branch -M main', { cwd: projectPath });
    } catch {}

    try {
      await execPromise('git remote remove origin', { cwd: projectPath });
    } catch {}

    // Add origin
    await execPromise(`git remote add origin "${cloneUrl}"`, { cwd: projectPath });

    // Protect .env in .gitignore
    const gitignorePath = path.join(projectPath, '.gitignore');
    let gitignore = existsSync(gitignorePath) ? await fs.readFile(gitignorePath, 'utf-8') : '';
    let updatedGitignore = false;
    if (!gitignore.includes('.env')) {
      gitignore += '\n.env\n.env.local\n.env.*.local\n';
      updatedGitignore = true;
    }
    if (!gitignore.includes('*.backup')) {
      gitignore += '\n*.backup\n';
      updatedGitignore = true;
    }
    if (updatedGitignore) {
      await fs.writeFile(gitignorePath, gitignore, 'utf-8');
    }

    // Untrack .env and backups if accidentally tracked
    try {
      await execPromise('git rm --cached .env .env.local *.backup -f', { cwd: projectPath });
    } catch {}

    // Stage and commit
    await execPromise('git add .', { cwd: projectPath });
    try {
      await execPromise('git commit -m "Initial commit via DevHub"', { cwd: projectPath });
    } catch {}

    // Push with token auth in URL for seamless non-interactive first push
    const authCloneUrl = cloneUrl.replace('https://', `https://${githubToken.trim()}@`);
    try {
      await execPromise(`git push -u "${authCloneUrl}" main`, { cwd: projectPath, timeout: 35000 });
    } catch (pushErr) {
      await execPromise('git push -u origin main', { cwd: projectPath, timeout: 35000 });
    }

    res.json({
      success: true,
      message: `🎉 Dépôt "${repoName}" créé sur GitHub et code pushé avec succès !`,
      githubUrl: htmlUrl,
      remoteUrl: cloneUrl,
      branch: 'main',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Serve frontend in production
const distPath = path.join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 DevHub est en ligne !`);
  console.log(`🔗 URL : http://localhost:${PORT}`);
  console.log(`📁 Répertoire géré : ${ROOT_DIR}`);
  console.log(`=================================================\n`);
});
