import { useEffect, useState } from "react";
import { getData, addEmployee, deleteEmployee, updateEmployee } from "../services/api";
import RendementPersonnel from "./RendementPersonnel";

function Employees({ project }) {
  const [db, setDb] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [view, setView] = useState("list"); 
  
  const [formData, setFormData] = useState({ matricule: "", nom: "", prenom: "", qualif: "" });

  useEffect(() => { loadData(); }, [project]);

  const loadData = async () => {
    const data = await getData();
    setDb(data);
  };

  if (view === "rendement") {
    return <RendementPersonnel project={project} onBack={() => setView("list")} />;
  }

  const openAddModal = () => {
    setEditIndex(null);
    setFormData({ matricule: "", nom: "", prenom: "", qualif: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (index, empData) => {
    setEditIndex(index);
    // Gestion de la compatibilité : si empData est un objet ou un tableau
    if (Array.isArray(empData)) {
      setFormData({ matricule: empData[0], nom: empData[1], prenom: empData[2], qualif: empData[3] });
    } else {
      setFormData({ 
        matricule: empData.matricule || "", 
        nom: empData.nom || "", 
        prenom: empData.prenom || "", 
        qualif: empData.qualif || "" 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Pour le rendement, on préfère stocker sous forme d'OBJET
    const employeeObject = {
      matricule: formData.matricule,
      nom: formData.nom.toUpperCase(),
      prenom: formData.prenom.toUpperCase(),
      qualif: formData.qualif,
      rendement: editIndex !== null && !Array.isArray(db[project].personnel[editIndex]) 
                 ? db[project].personnel[editIndex].rendement 
                 : []
    };
    
    if (editIndex !== null) {
      await updateEmployee({ project, index: editIndex, updated: employeeObject });
    } else {
      await addEmployee({ project, employee: employeeObject });
    }
    
    setIsModalOpen(false);
    loadData();
  };

  if (!db || !db[project]) return <div className="p-6 text-center">Chargement des données...</div>;

  // Sécurité : on s'assure que personnel est un tableau
  const personnel = db[project].personnel || db[project].lignes_employes || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion du Personnel</h2>
          <p className="text-sm text-gray-500">Projet : {project}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setView("rendement")}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow hover:bg-orange-600 transition flex items-center gap-2"
          >
            📊 Suivi Rendement
          </button>
          <button 
            onClick={openAddModal} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            + Ajouter Employé
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
              {editIndex !== null ? "Modifier" : "Nouvel"} Employé
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Matricule</label>
                <input type="text" className="w-full border p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.matricule} onChange={(e) => setFormData({...formData, matricule: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nom</label>
                  <input type="text" className="w-full border p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none uppercase" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Prénom</label>
                  <input type="text" className="w-full border p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none uppercase" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Qualification</label>
                <input type="text" className="w-full border p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.qualif} onChange={(e) => setFormData({...formData, qualif: e.target.value})} required />
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 px-4 py-2 font-medium hover:text-gray-600">Annuler</button>
                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="p-4 text-xs uppercase font-bold border-b">Matricule</th>
              <th className="p-4 text-xs uppercase font-bold border-b">Nom</th>
              <th className="p-4 text-xs uppercase font-bold border-b">Prénom</th>
              <th className="p-4 text-xs uppercase font-bold border-b">Qualification</th>
              <th className="p-4 text-center text-xs uppercase font-bold border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {personnel.length > 0 ? personnel.map((emp, i) => {
              // Extraction des données qu'il s'agisse d'un Array ou d'un Objet
              const mtr = Array.isArray(emp) ? emp[0] : emp.matricule;
              const nom = Array.isArray(emp) ? emp[1] : emp.nom;
              const pre = Array.isArray(emp) ? emp[2] : emp.prenom;
              const qlf = Array.isArray(emp) ? emp[3] : emp.qualif;

              return (
                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 text-sm font-mono text-blue-600">{mtr}</td>
                  <td className="p-4 text-sm font-bold text-gray-700 uppercase" dir="auto">{nom}</td>
                  <td className="p-4 text-sm text-gray-600 uppercase" dir="auto">{pre}</td>
                  <td className="p-4 text-sm text-gray-500">{qlf}</td>
                  <td className="p-4 text-center space-x-4">
                    <button onClick={() => openEditModal(i, emp)} className="text-amber-600 hover:text-amber-800 font-medium text-sm">Modifier</button>
                    <button onClick={() => window.confirm("Supprimer cet employé ?") && deleteEmployee({project, index: i}).then(loadData)} className="text-red-500 hover:text-red-700 font-medium text-sm">Supprimer</button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-400 italic">Aucun employé dans ce projet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Employees;