const fs = require("fs");
const path = require("path");
const { app } = require("electron");

// 1. Chemin vers le fichier "source" (à côté de main.cjs)
const srcPath = path.join(__dirname, "../db.json"); 

// 2. Chemin vers le fichier "de travail" (Autorisé en écriture par Windows)
const userDataPath = app.getPath("userData");
const destPath = path.join(userDataPath, "db.json");

const dataService = {
  readData: () => {
    try {
      let activePath = srcPath;

      // Si l'app est installée/exportée, on utilise le dossier UserData
      if (app.isPackaged) {
        if (!fs.existsSync(destPath)) {
          // Au premier lancement, on copie le db.json d'origine vers le dossier de travail
          fs.copyFileSync(srcPath, destPath);
        }
        activePath = destPath;
      }

      const rawData = fs.readFileSync(activePath, "utf8");
      return JSON.parse(rawData);
    } catch (error) {
      console.error("Erreur lors de la lecture du JSON:", error);
      return {}; // Retourne un objet vide pour éviter le crash du Dashboard
    }
  },

  writeData: (data) => {
    try {
      // En développement on écrit dans le dossier source, en prod dans UserData
      const activePath = app.isPackaged ? destPath : srcPath;
      fs.writeFileSync(activePath, JSON.stringify(data, null, 2), "utf8");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de l'écriture:", error);
      return { success: false };
    }
  }
};

module.exports = dataService;