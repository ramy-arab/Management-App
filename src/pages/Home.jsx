import React from "react";

function Home({ db, onSelectProject }) {
  const projectNames = Object.keys(db);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-800">Tableau de Bord</h1>
          <p className="text-gray-500">Sélectionnez un projet pour gérer les ressources.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectNames.map((name) => (
            <div
              key={name}
              onClick={() => onSelectProject(name)}
              className="group bg-white p-6 rounded-2xl shadow-sm border border-transparent hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl bg-gray-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  {db[name].icon || "🏗️"}
                </span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">
                  Actif
                </span>
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2 truncate">{name}</h2>
              
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Employés</p>
                  <p className="font-bold text-gray-700">{db[name].lignes_employes?.length || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Engins</p>
                  <p className="font-bold text-gray-700">{db[name].lignes_engins?.length || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;