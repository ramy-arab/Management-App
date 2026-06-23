

const dataService = require("./services/dataService.cjs");

// Assurez-vous que 'dialog' est bien présent ici dans les accolades
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
// ... le reste de vos imports

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Chemin vers preload.cjs
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Gestion du chargement selon le mode (Dev ou Prod)
  if (app.isPackaged) {
    // Mode Production : charge le fichier index.html dans le dossier dist
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    // Mode Développement : charge l'URL de Vite
    win.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(createWindow);

// --- 📌 COMMUNICATIONS IPC ---

ipcMain.handle("get-data", () => {
  return dataService.readData();
});

// N'oubliez pas d'ajouter les autres handlers si vous en avez (save-data, etc.)
ipcMain.handle("save-data", (event, newData) => {
  return dataService.writeData(newData);
});
// --- 📌 EMPLOYEES ---
ipcMain.handle("add-employee", (event, { project, employee }) => {
  const db = dataService.readData();
  db[project].lignes_employes.push(employee);
  dataService.writeData(db);
  return db;
});

ipcMain.handle("delete-employee", (event, { project, index }) => {
  const db = dataService.readData();
  db[project].lignes_employes.splice(index, 1);
  dataService.writeData(db);
  return db;
});

ipcMain.handle("update-employee", (event, { project, index, updated }) => {
  const db = dataService.readData();
  db[project].lignes_employes[index] = updated;
  dataService.writeData(db);
  return db;
});

// --- 📌 RENDEMENT (Correction ici) ---
ipcMain.handle('add-rendement', async (event, { project, record }) => {
  try {
    const db = dataService.readData();
    if (!db[project].rendement_journalier) {
      db[project].rendement_journalier = [];
    }
    db[project].rendement_journalier.push(record);
    dataService.writeData(db);
    return { success: true };
  } catch (error) {
    console.error("Erreur backend add-rendement:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-rendement', async (event, { project, index, updated }) => {
  try {
    const db = dataService.readData();
    
    if (db[project].rendement_journalier) {
      // SI L'ACTION EST UNE SUPPRESSION
      if (updated === null) {
        db[project].rendement_journalier.splice(index, 1);
      } else {
        // SINON C'EST UNE MISE À JOUR CLASSIQUE
        db[project].rendement_journalier[index] = updated;
      }
      
      dataService.writeData(db);
      return { success: true };
    }
    return { success: false, error: "Liste introuvable" };
  } catch (error) {
    console.error("Erreur update-rendement:", error);
    return { success: false, error: error.message };
  }
});

// --- 📌 ENGINS ---
ipcMain.handle("add-engin", (event, { project, engin }) => {
  const db = dataService.readData();
  db[project].lignes_engins.push(engin);
  dataService.writeData(db);
  return db;
});

ipcMain.handle("delete-engin", (event, { project, index }) => {
  const db = dataService.readData();
  db[project].lignes_engins.splice(index, 1);
  dataService.writeData(db);
  return db;
});

ipcMain.handle("update-engin", (event, { project, index, updated }) => {
  const db = dataService.readData();
  db[project].lignes_engins[index] = updated;
  dataService.writeData(db);
  return db;
});

// --- 📌 SUIVI ---
ipcMain.handle("add-suivi", (event, { project, record }) => {
  const db = dataService.readData();
  db[project].suivi.push(record);
  dataService.writeData(db);
  return db;
});

ipcMain.handle("update-suivi", (event, { project, index, updated }) => {
  const db = dataService.readData();
  db[project].suivi[index] = updated;
  dataService.writeData(db);
  return db;
});

ipcMain.handle("delete-suivi", (event, { project, index }) => {
  const db = dataService.readData();
  db[project].suivi.splice(index, 1);
  dataService.writeData(db);
  return db;
});

// --- 📌 PDF EXPORT ---
ipcMain.handle("export-pdf", async (event, projectName) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  const options = { marginsType: 0, pageSize: 'A4', printBackground: true, landscape: false };

  try {
    const data = await webContents.printToPDF(options);
    const { filePath } = await dialog.showSaveDialog(win, {
      title: 'Exporter le suivi en PDF',
      defaultPath: `Suivi_Projet_${projectName}_${new Date().toISOString().split('T')[0]}.pdf`,
      filters: [{ name: 'Documents PDF', extensions: ['pdf'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, data);
      return { success: true, path: filePath };
    }
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
});