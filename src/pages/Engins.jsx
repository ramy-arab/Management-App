import { useEffect, useState } from "react";
import { getData, addEngin, deleteEngin, updateEngin } from "../services/api";

function Engins({ project }) {
  const [db, setDb] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({ marque: "", type: "", serie: "" });

  useEffect(() => { loadData(); }, [project]);

  const loadData = async () => {
    const data = await getData();
    setDb(data);
  };

  const openAddModal = () => {
    setEditIndex(null);
    setFormData({ marque: "", type: "", serie: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (index, enginData) => {
    setEditIndex(index);
    setFormData({ marque: enginData[0], type: enginData[1], serie: enginData[2] });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enginArray = [formData.marque, formData.type, formData.serie];
    
    if (editIndex !== null) {
      await updateEngin({ project, index: editIndex, updated: enginArray });
    } else {
      await addEngin({ project, engin: enginArray });
    }
    
    setIsModalOpen(false);
    loadData();
  };

  if (!db || !db[project]) return <div className="p-6 text-gray-500">Chargement...</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 italic">Parc Engins</h2>
        <button onClick={openAddModal} className="bg-orange-600 text-white px-4 py-2 rounded-lg">+ Ajouter</button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editIndex !== null ? "Modifier" : "Ajouter"} l'engin</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Marque" className="w-full border p-2 rounded" value={formData.marque} onChange={(e) => setFormData({...formData, marque: e.target.value})} required />
              <input type="text" placeholder="Type" className="w-full border p-2 rounded" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} />
              <input type="text" placeholder="Série du type" className="w-full border p-2 rounded" value={formData.serie} onChange={(e) => setFormData({...formData, serie: e.target.value})} required />
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 px-4 py-2 font-medium">Annuler</button>
                <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            {db[project].colonnes.map((col, i) => <th key={i} className="p-3 text-xs uppercase font-bold">{col}</th>)}
            <th className="p-3 text-center text-xs uppercase font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {db[project].lignes_engins.map((engin, i) => (
            <tr key={i} className="border-b hover:bg-orange-50">
              {engin.map((val, j) => <td key={j} className="p-3 text-sm">{val}</td>)}
              <td className="p-3 text-center space-x-3">
                <button onClick={() => openEditModal(i, engin)} className="text-amber-600 hover:underline">Modifier</button>
                <button onClick={() => deleteEngin({project, index: i}).then(loadData)} className="text-red-500 hover:underline">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Engins;