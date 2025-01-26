import { defineStore } from "pinia";

export const useLeadStore = defineStore("lead", {
  state: () => ({
    leads: [],
  }),
  actions: {
    addLead(lead) {
      this.leads.push(lead);
      this.saveLeadsToLocalStorage();
    },
    saveLeadsToLocalStorage() {
      localStorage.setItem("leads", JSON.stringify(this.leads));
    },
    loadLeadsFromLocalStorage() {
      const storedLeads = localStorage.getItem("leads");
      if (storedLeads) {
        this.leads = JSON.parse(storedLeads);
      }
    },
  },
});
