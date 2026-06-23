import { useEffect, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { getData, addSuivi, updateSuivi, deleteSuivi, exportPDF } from "../services/api";
import * as XLSX from 'xlsx'; // <--- AJOUT DE L'IMPORT

function Suivi({ project }) {
  const [db, setDb] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showPointageModal, setShowPointageModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [openGraphIndex, setOpenGraphIndex] = useState(null);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);
  const [selectedPointageIndex, setSelectedPointageIndex] = useState(null);
  const [isEditingTask, setIsEditingTask] = useState(false);

  const unites = ["M2", "M3", "ML", "U", "F", "T"];

  const [taskForm, setTaskForm] = useState({ 
    desig: "", 
    q_contrat: "", 
    q_preced: "", 
    unite: "M3", 
    pu: "",
    delai_mois: "" 
  });

  const [pointageForm, setPointageForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    q_jour: "", 
    nb_engins: "", 
    nb_voyages: "", 
    comm: "" 
  });

  useEffect(() => { loadData(); }, [project]);

  const loadData = async () => {
    const data = await getData();
    setDb(data);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const result = await exportPDF(project);
    setIsExporting(false);
    if (result?.success) alert("Suivi exporté avec succès !");
  };

  // --- AJOUT DE LA FONCTION EXPORT EXCEL ---
  const handleExportExcel = () => {
    const dataToExport = [];
    
    db[project].suivi.forEach(task => {
      // Pour chaque tâche, on parcourt ses pointages journaliers
      (task.details_journaliers || []).forEach(day => {
        dataToExport.push({
          "Désignation": task.desig,
          "Unité": task.unite,
          "P.U (DA)": task.pu,
          "Date": day.date,
          "Qté Jour": day.q_jour,
          "Montant HT": Number(day.q_jour) * Number(task.pu),
          "Engins": day.nb_engins,
          "Voyages": day.nb_voyages,
          "Commentaire": day.comm
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Suivi Avancement");
    
    // Générer le fichier et déclencher le téléchargement
    XLSX.writeFile(workbook, `Suivi_${project}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    const formattedTask = {
      ...taskForm,
      pu: Number(taskForm.pu),
      q_contrat: Number(taskForm.q_contrat),
      q_preced: Number(taskForm.q_preced) || 0,
      delai_mois: Number(taskForm.delai_mois) || 0
    };

    if (isEditingTask) {
      const task = { ...db[project].suivi[selectedTaskIndex], ...formattedTask };
      await updateSuivi({ project, index: selectedTaskIndex, updated: task });
    } else {
      const newTask = { ...formattedTask, details_journaliers: [] };
      await addSuivi({ project, record: newTask });
    }
    setShowTaskModal(false);
    loadData();
  };

  const handleSavePointage = async (e) => {
    e.preventDefault();
    const task = { ...db[project].suivi[selectedTaskIndex] };
    const points = [...(task.details_journaliers || [])];
    const formattedPoint = { 
      ...pointageForm, 
      q_jour: Number(pointageForm.q_jour),
      nb_voyages: Number(pointageForm.nb_voyages) || 0 
    };

    if (selectedPointageIndex !== null) points[selectedPointageIndex] = formattedPoint;
    else points.push(formattedPoint);

    task.details_journaliers = points;
    await updateSuivi({ project, index: selectedTaskIndex, updated: task });
    setShowPointageModal(false);
    loadData();
  };

  const handleDeletePointage = async (taskIdx, pointIdx) => {
    if (window.confirm("Supprimer ce pointage ?")) {
      const task = { ...db[project].suivi[taskIdx] };
      task.details_journaliers.splice(pointIdx, 1);
      await updateSuivi({ project, index: taskIdx, updated: task });
      loadData();
    }
  };

  if (!db || !db[project]) return <div className="p-6 text-gray-500">Chargement...</div>;

  return (
    <div className="p-6">
      {/* HEADER PAGE */}
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-2xl font-bold text-gray-800 italic">📈 Suivi d'Avancement</h2>
        <div className="flex gap-3">
          {/* BOUTON EXCEL AJOUTÉ ICI */}
          <button 
            onClick={handleExportExcel} 
            className="bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-200 flex items-center gap-2"
          >
            📊 Exporter Excel
          </button>
          
          <button onClick={handleExport} disabled={isExporting} className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700 flex items-center gap-2">
            {isExporting ? "Chargement..." : "📄 Exporter PDF"}
          </button>
          <button 
            onClick={() => { 
              setIsEditingTask(false); 
              setTaskForm({desig:"", q_contrat:"", q_preced:"", unite:"M3", pu:"", delai_mois:""}); 
              setShowTaskModal(true); 
            }} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
          >
            + Nouvelle Désignation
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {db[project].suivi.map((task, idx) => {
          const pointages = task.details_journaliers || [];
          const totalQSuivi = pointages.reduce((sum, day) => sum + Number(day.q_jour), 0);
          const totalMontantHT = totalQSuivi * Number(task.pu);
          const qRestante = Number(task.q_contrat) - Number(task.q_preced) - totalQSuivi;

          const nbJoursTravailles = pointages.length;
          const moyenneProductionJour = nbJoursTravailles > 0 ? (totalQSuivi / nbJoursTravailles) : 0;
          const estimationJoursRestants = (moyenneProductionJour > 0 && qRestante > 0) 
            ? Math.ceil(qRestante / moyenneProductionJour) 
            : 0;

          const chartData = [...pointages]
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(d => ({ date: d.date, q: Number(d.q_jour) }));

          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm break-inside-avoid">
              
              <div className="bg-slate-800 text-white p-4">
                <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-2">
                  <div>
                    <p className="font-bold text-lg leading-tight uppercase tracking-wide">{task.desig}</p>
                    <p className="text-sm text-blue-400 font-medium">{Number(task.pu).toLocaleString()} DA / {task.unite}</p>
                  </div>
                  <div className="flex gap-2 no-print">
                    <button onClick={() => setOpenGraphIndex(openGraphIndex === idx ? null : idx)} className={`text-xs px-3 py-1 rounded transition ${openGraphIndex === idx ? 'bg-blue-500' : 'bg-slate-700 text-blue-300 hover:bg-slate-600'}`}>
                      {openGraphIndex === idx ? "Cacher Graph" : "📊 Graphique"}
                    </button>
                    <button onClick={() => { setIsEditingTask(true); setSelectedTaskIndex(idx); setTaskForm({...task}); setShowTaskModal(true); }} className="text-xs bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">Modifier</button>
                    <button onClick={() => window.confirm("Supprimer?") && deleteSuivi({project, index: idx}).then(loadData)} className="text-xs bg-rose-900/50 px-2 py-1 rounded hover:bg-rose-800">Supprimer</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div><p className="text-[10px] text-slate-400 uppercase font-bold">Qté Contrat</p><p className="font-bold">{Number(task.q_contrat).toLocaleString()}</p></div>
                  <div className="border-l border-slate-700 pl-3"><p className="text-[10px] text-slate-400 uppercase font-bold text-orange-400">Antérieur</p><p className="font-bold text-orange-400">{Number(task.q_preced).toLocaleString()}</p></div>
                  <div className="border-l border-slate-700 pl-3"><p className="text-[10px] text-slate-400 uppercase font-bold text-cyan-400">Cumul Suivi</p><p className="font-bold text-cyan-400">{totalQSuivi.toLocaleString()}</p></div>
                  <div className="border-l border-slate-700 pl-3"><p className="text-[10px] text-slate-400 uppercase font-bold text-emerald-400">Total HT</p><p className="font-bold text-emerald-400">{totalMontantHT.toLocaleString()} DA</p></div>
                  <div className="border-l border-slate-700 pl-3"><p className="text-[10px] text-slate-400 uppercase font-bold text-rose-400">Reste</p><p className="font-bold text-rose-400">{qRestante.toLocaleString()}</p></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
                  <div className="flex flex-col">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Délai Contrat</p>
                    <p className="font-bold text-blue-300">{task.delai_mois} Mois <span className="text-[10px] font-normal text-slate-500 ml-1">({task.delai_mois * 30} jours)</span></p>
                  </div>
                  <div className="flex flex-col border-l border-slate-700 pl-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold text-yellow-400">Moyenne Production / Jour</p>
                    <p className="font-bold text-yellow-400">{moyenneProductionJour.toLocaleString(undefined, {maximumFractionDigits: 2})} {task.unite}/jour</p>
                  </div>
                  <div className="flex flex-col border-l border-slate-700 pl-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold text-purple-400">Estimation Jours Restants</p>
                    <p className="font-bold text-purple-400">{estimationJoursRestants > 0 ? `${estimationJoursRestants} jours de travail` : "---"}</p>
                  </div>
                </div>
              </div>

              {openGraphIndex === idx && (
                <div className="p-4 bg-white border-b" style={{ height: "250px" }}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={10} tickFormatter={(d) => d.split('-').reverse().slice(0,2).join('/')} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Area type="monotone" dataKey="q" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-gray-400 text-sm italic py-10">Aucun pointage</p>}
                </div>
              )}

              <div className="p-4 bg-gray-50/50">
                <table className="w-full text-xs bg-white rounded border shadow-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 font-bold">
                      <th className="p-2 border text-left">Date</th>
                      <th className="p-2 border text-right">Qté Jour</th>
                      <th className="p-2 border text-right">Montant HT</th>
                      <th className="p-2 border text-center">Engins</th>
                      <th className="p-2 border text-center">Voyages</th>
                      <th className="p-2 border text-left">Commentaires</th>
                      <th className="p-2 border text-center no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointages.map((day, dIdx) => (
                      <tr key={dIdx} className="hover:bg-blue-50/50">
                        <td className="p-2 border">{day.date}</td>
                        <td className="p-2 border text-right font-bold text-blue-600">{Number(day.q_jour).toLocaleString()}</td>
                        <td className="p-2 border text-right">{(Number(day.q_jour) * Number(task.pu)).toLocaleString()} DA</td>
                        <td className="p-2 border text-center">{day.nb_engins}</td>
                        <td className="p-2 border text-center font-bold text-orange-600">{day.nb_voyages || 0}</td>
                        <td className="p-2 border text-gray-500 italic" dir="auto">{day.comm}</td>
                        <td className="p-2 border text-center space-x-2 no-print">
                           <button onClick={() => { setSelectedTaskIndex(idx); setSelectedPointageIndex(dIdx); setPointageForm({...day}); setShowPointageModal(true); }} className="text-blue-500">Modifier</button>
                           <button onClick={() => handleDeletePointage(idx, dIdx)} className="text-red-500">Supprimer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button 
                  onClick={() => { 
                    setSelectedTaskIndex(idx); 
                    setSelectedPointageIndex(null); 
                    setPointageForm({date: new Date().toISOString().split('T')[0], q_jour: "", nb_engins: "", nb_voyages: "", comm: ""}); 
                    setShowPointageModal(true); 
                  }} 
                  className="mt-4 text-blue-600 font-bold text-xs uppercase hover:underline no-print"
                >
                  + Ajouter Pointage Journalier
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALE DESIGNATION */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
           <form onSubmit={handleSaveTask} className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
              <h3 className="text-xl font-bold mb-6 border-b pb-2">{isEditingTask ? "Modifier" : "Nouvelle Tâche"}</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Désignation" className="w-full border p-3 rounded-xl outline-none" value={taskForm.desig} onChange={(e)=>setTaskForm({...taskForm, desig: e.target.value})} required />
                
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full border p-3 rounded-xl" value={taskForm.unite} onChange={(e)=>setTaskForm({...taskForm, unite: e.target.value})}>
                    {unites.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input type="number" placeholder="Prix Unitaire (DA)" className="w-full border p-3 rounded-xl" value={taskForm.pu} onChange={(e)=>setTaskForm({...taskForm, pu: e.target.value})} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Qté Contrat" className="w-full border p-3 rounded-xl" value={taskForm.q_contrat} onChange={(e)=>setTaskForm({...taskForm, q_contrat: e.target.value})} required />
                  <input type="number" placeholder="Qté Antérieure" className="w-full border p-3 rounded-xl" value={taskForm.q_preced} onChange={(e)=>setTaskForm({...taskForm, q_preced: e.target.value})} />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Délai Contractuel (Mois)</label>
                  <input type="number" placeholder="Ex: 12" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={taskForm.delai_mois} onChange={(e)=>setTaskForm({...taskForm, delai_mois: e.target.value})} required />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={()=>setShowTaskModal(false)} className="px-5 py-2 text-gray-500">Annuler</button>
                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs">Enregistrer</button>
              </div>
           </form>
        </div>
      )}

      {/* MODALE POINTAGE */}
      {showPointageModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
           <form onSubmit={handleSavePointage} className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-6">Saisie Production</h3>
              <div className="space-y-4">
                <input type="date" className="w-full border p-3 rounded-xl" value={pointageForm.date} onChange={(e)=>setPointageForm({...pointageForm, date: e.target.value})} required />
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Quantité réalisée" className="w-full border p-3 rounded-xl" value={pointageForm.q_jour} onChange={(e)=>setPointageForm({...pointageForm, q_jour: e.target.value})} required />
                  <input type="number" placeholder="Nombre de voyages" className="w-full border p-3 rounded-xl" value={pointageForm.nb_voyages} onChange={(e)=>setPointageForm({...pointageForm, nb_voyages: e.target.value})} />
                </div>

                <input type="text" placeholder="Engins (ex: 2 pelles)" className="w-full border p-3 rounded-xl" value={pointageForm.nb_engins} onChange={(e)=>setPointageForm({...pointageForm, nb_engins: e.target.value})} />
                <textarea placeholder="Observations..." className="w-full border p-3 rounded-xl" value={pointageForm.comm} onChange={(e)=>setPointageForm({...pointageForm, comm: e.target.value})} rows="2" dir="auto"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={()=>setShowPointageModal(false)} className="px-5 py-2 text-gray-500">Annuler</button>
                <button type="submit" className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs">Valider</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}

export default Suivi;