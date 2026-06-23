export const getData = () => window.api?.getData();

// RH
export const addEmployee = (data) => window.api?.addEmployee(data);
export const deleteEmployee = (data) => window.api?.deleteEmployee(data);
export const updateEmployee = (data) => window.api?.updateEmployee(data);

// ENGINS
export const addEngin = (data) => window.api?.addEngin(data);
export const deleteEngin = (data) => window.api?.deleteEngin(data);
export const updateEngin = (data) => window.api?.updateEngin(data);

// SUIVI
export const addSuivi = (data) => window.api?.addSuivi(data);
export const updateSuivi = (data) => window.api?.updateSuivi(data);
export const deleteSuivi = (data) => window.api?.deleteSuivi(data);

// EXPORT PDF
export const exportPDF = (projectName) => window.api?.invoke("export-pdf", projectName);

// ... vos autres exports ...
export const addRendement = (data) => window.api?.invoke("add-rendement", data);
export const updateRendement = (data) => window.api?.invoke("update-rendement", data);