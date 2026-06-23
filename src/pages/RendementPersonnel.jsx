import { useState, useEffect } from "react";
import { getData, addRendement, updateRendement } from "../services/api";

function RendementPersonnel({ project, onBack }) {
  const [employees, setEmployees] = useState([]);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showEditEmpModal, setShowEditEmpModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEmpForm, setNewEmpForm] = useState({ nom: "", matricule: "" });
  const [editEmpForm, setEditEmpForm] = useState({ nom: "", matricule: "", index: null });

  useEffect(() => { loadEmployees(); }, [project]);

  const loadEmployees = async () => {
    const data = await getData();
    const list = data[project]?.rendement_journalier || [];
    setEmployees(list.filter(e => e !== null));
  };

  const allDates = [...new Set(employees.flatMap(emp => 
    emp?.rendement ? emp.rendement.map(r => r.date) : []
  ))].sort();

  const handleUpdateValue = async (empIdx, date, newValue) => {
    if (newValue < 0) return;
    let emp = { ...employees[empIdx] };
    if (!emp.rendement) emp.rendement = [];
    const dateIdx = emp.rendement.findIndex(r => r.date === date);
    if (dateIdx > -1) emp.rendement[dateIdx].voyages = newValue;
    else emp.rendement.push({ date: date, voyages: newValue });

    const newEmployees = [...employees];
    newEmployees[empIdx] = emp;
    setEmployees(newEmployees);
    await updateRendement({ project, index: empIdx, updated: emp });
  };

  const handleAddNewDate = async (e) => {
    e.preventDefault();
    if (employees.length === 0) return alert("Ajoutez d'abord un employé.");
    if (allDates.includes(newDate)) return setShowDateModal(false);
    await handleUpdateValue(0, newDate, 0);
    setShowDateModal(false);
  };

  const handleAddNewEmployee = async (e) => {
    e.preventDefault();
    const newRecord = { matricule: newEmpForm.matricule.toUpperCase(), nom: newEmpForm.nom.toUpperCase(), rendement: [] };
    const result = await addRendement({ project, record: newRecord });
    if (result.success) {
      setNewEmpForm({ nom: "", matricule: "" });
      setShowAddEmpModal(false);
      loadEmployees();
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    let emp = { ...employees[editEmpForm.index] };
    emp.nom = editEmpForm.nom.toUpperCase();
    emp.matricule = editEmpForm.matricule.toUpperCase();
    await updateRendement({ project, index: editEmpForm.index, updated: emp });
    setShowEditEmpModal(false);
    loadEmployees();
  };

  const handleDeleteEmployee = async (idx) => {
    if (window.confirm("❗ Supprimer cet employé ?")) {
      await updateRendement({ project, index: idx, updated: null });
      loadEmployees();
    }
  };

  return (
    <div className="p-4 h-screen flex flex-col bg-slate-50">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 10px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* HEADER FIXE */}
      <div className="flex justify-between items-center mb-4 no-print">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white rounded-full shadow-sm">←</button>
            <h2 className="text-xl font-bold text-slate-800">📊 Suivi de Production</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDateModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg shadow text-sm font-bold transition-colors">+ Date</button>
          <button onClick={() => setShowAddEmpModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow text-sm font-bold transition-colors">+ Employé</button>
        </div>
      </div>

      {/* ZONE TABLEAU */}
      <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 rounded-xl bg-white shadow-sm">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 z-50">
              <tr className="bg-slate-100">
                <th className="p-3 border-b border-r text-left sticky left-0 bg-slate-100 z-50 min-w-[220px]">Employé</th>
                {allDates.map(date => (
                  <th key={date} className="p-2 border-b border-r text-center min-w-[100px] bg-slate-50 font-bold text-blue-600">
                    {date.split('-').reverse().slice(0,2).join('/')}
                  </th>
                ))}
                <th className="p-3 border-b border-l text-center sticky right-[80px] bg-blue-100 z-50 min-w-[80px] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">Moyenne</th>
                <th className="p-3 border-b border-l text-center sticky right-0 bg-emerald-100 z-50 min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => {
                const rendement = emp.rendement || [];
                const total = rendement.reduce((sum, r) => sum + Number(r.voyages), 0);
                const jours = rendement.filter(r => Number(r.voyages) > 0).length;
                const moyenne = jours > 0 ? (total / jours).toFixed(1) : 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-3 border-b border-r sticky left-0 bg-white z-40 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-700 uppercase leading-tight">{emp.nom}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">{emp.matricule}</div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print ml-2">
                          <button onClick={() => { setEditEmpForm({ nom: emp.nom, matricule: emp.matricule, index: idx }); setShowEditEmpModal(true); }} className="p-1 text-amber-600">✏️</button>
                          <button onClick={() => handleDeleteEmployee(idx)} className="p-1 text-red-500">🗑️</button>
                        </div>
                      </div>
                    </td>
                    {allDates.map(date => {
                      const entry = rendement.find(r => r.date === date);
                      const val = entry ? Number(entry.voyages) : 0;
                      return (
                        <td key={date} className="p-1 border-b border-r text-center bg-white z-10">
                          <div className="flex items-center justify-between px-1 bg-slate-50 rounded border border-slate-100">
                            <button onClick={() => handleUpdateValue(idx, date, val - 1)} className="w-6 h-6 text-red-500 font-bold">-</button>
                            <span className={`font-bold ${val > 0 ? 'text-blue-700' : 'text-slate-300'}`}>{val}</span>
                            <button onClick={() => handleUpdateValue(idx, date, val + 1)} className="w-6 h-6 text-emerald-500 font-bold">+</button>
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-3 border-b border-l text-center font-bold text-blue-700 sticky right-[80px] bg-blue-50 z-40 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">{moyenne}</td>
                    <td className="p-3 border-b border-l text-center font-black text-emerald-700 sticky right-0 bg-emerald-50 z-40">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- LES MODALES (Placées ici pour être toujours accessibles au clavier) --- */}
      
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-4 text-lg">Nouvel Employé</h3>
            <form onSubmit={handleAddNewEmployee}>
              <div className="space-y-3">
                <input 
                   type="text" 
                   placeholder="Nom Complet" 
                   className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" 
                   value={newEmpForm.nom} 
                   onChange={e => setNewEmpForm({...newEmpForm, nom: e.target.value})} 
                   required 
                   autoFocus
                />
                <input 
                   type="text" 
                   placeholder="Matricule" 
                   className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" 
                   value={newEmpForm.matricule} 
                   onChange={e => setNewEmpForm({...newEmpForm, matricule: e.target.value})} 
                   required 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddEmpModal(false)} className="text-slate-400 font-medium px-4">Annuler</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditEmpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-4 text-lg">Modifier l'employé</h3>
            <form onSubmit={handleEditEmployee}>
              <div className="space-y-3">
                <input type="text" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-800" value={editEmpForm.nom} onChange={e => setEditEmpForm({...editEmpForm, nom: e.target.value})} required />
                <input type="text" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-800" value={editEmpForm.matricule} onChange={e => setEditEmpForm({...editEmpForm, matricule: e.target.value})} required />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEditEmpModal(false)} className="text-slate-400 font-medium px-4">Annuler</button>
                <button type="submit" className="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-4 text-lg">Nouvelle Date</h3>
            <form onSubmit={handleAddNewDate}>
              <input type="date" className="w-full border p-3 rounded-xl mb-4 text-slate-800" value={newDate} onChange={e => setNewDate(e.target.value)} required />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDateModal(false)} className="text-slate-400 font-medium px-4">Annuler</button>
                <button type="submit" className="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RendementPersonnel;