import { useState } from "react";
import Employees from "./Employees";
import Engins from "./Engins";
import Suivi from "./Suivi";

function ProjectDashboard({ project, db, onBack }) {
  const [activeTab, setActiveTab] = useState("employees");

  return (
    <>
      <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg transition"
          >
            ← Projets
          </button>
          <h1 className="font-bold text-lg text-gray-800">
            {db[project].icon} {project}
          </h1>
        </div>
        
        <nav className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab("employees")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'employees' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Personnel
          </button>
          <button 
            onClick={() => setActiveTab("engins")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'engins' ? 'bg-white text-orange-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Engins
          </button>
          <button onClick={() => setActiveTab("suivi")} className={`px-4 py-2 rounded-lg ${activeTab === 'suivi' ? 'bg-white text-green-600 shadow' : ''}`}>Suivi</button>
        </nav>
      </header>

      <main className="container mx-auto py-6 px-4">
        {activeTab === "employees" && <Employees project={project} />}
        {activeTab === "engins" && <Engins project={project} />}
        {activeTab === "suivi" && <Suivi project={project} />}
      </main>

      
    </>
  );
}

export default ProjectDashboard;