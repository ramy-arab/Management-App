import { useState, useEffect } from "react";
import { getData } from "./services/api";
import Home from "./pages/Home";
import ProjectDashboard from "./pages/ProjectDashboard";

export default function App() {
  const [db, setDb] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const data = await getData();
    setDb(data);
  };

  if (!db) return <div className="flex h-screen items-center justify-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {!selectedProject ? (
        <Home 
          db={db} 
          onSelectProject={setSelectedProject} 
        />
      ) : (
        <ProjectDashboard 
          project={selectedProject} 
          db={db} 
          onBack={() => {
            setSelectedProject(null);
            loadAllData();
          }} 
        />
      )}
    </div>
  );
}