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
      localStorage.setItem("leads", JSON.stringify([...new Set(this.leads)]));
    },
    loadLeadsFromLocalStorage() {
      const storedLeads = localStorage.getItem("leads");
      if (storedLeads) {
        this.leads = JSON.parse(storedLeads);
      }
    },
    getLeadById(specificId) {
      return this.leads.find((lead) => lead.id === specificId);
    },

    updateLead(updatedLead) {
      const index = this.leads.findIndex((lead) => lead.id === updatedLead.id);
      if (index !== -1) {
        this.leads[index] = { ...this.leads[index], ...updatedLead };
        this.saveLeadsToLocalStorage();
      }
    },

    deleteLead(leadId) {
      this.leads = this.leads.filter((lead) => lead.id !== leadId);
      this.saveLeadsToLocalStorage();
    },
  },
});
