// Planning 2026 - Application PWA avec logique métier complète - VERSION CORRIGÉE
console.log("✅ Application Planning 2026 chargée !");

// =========================================================================
// CONSTANTES ET CONFIGURATION
// =========================================================================

const DATE_AFFECTATION_BASE = "2025-11-01";
const JOURS_FRANCAIS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Jours fériés Maroc 2026
const JOURS_FERIES_2026 = [
    '2026-01-01', '2026-01-11', '2026-05-01',
    '2026-07-30', '2026-08-14', '2026-08-20',
    '2026-08-21', '2026-11-06', '2026-11-18'
];

// =========================================================================
// CLASSE PRINCIPALE - VERSION SIMPLIFIÉE ET FONCTIONNELLE
// =========================================================================

class PlanningMetier {
    constructor() {
        this.agents = [];
        this.planning = {};
        this.conges = [];
        this.historiqueEchanges = [];
        this.radios = [];
        this.codesPanique = [];
        this.avertissements = [];
        this.joursFeries = [...JOURS_FERIES_2026];
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupServiceWorker();
        console.log(`✅ ${this.agents.length} agents initialisés`);
    }

    // =========================================================================
    // GESTION DES DONNÉES
    // =========================================================================

    loadData() {
        try {
            // Charger depuis data.js si disponible
            if (window.agentsData && window.agentsData.length > 0) {
                this.agents = window.agentsData;
                console.log(`📥 ${this.agents.length} agents chargés depuis data.js`);
            } else {
                // Sinon depuis localStorage
                const saved = localStorage.getItem('planning_agents');
                this.agents = saved ? JSON.parse(saved) : [];
                console.log(`📥 ${this.agents.length} agents chargés depuis localStorage`);
            }

            // Charger les autres données
            const planningSaved = localStorage.getItem('planning_shifts');
            this.planning = planningSaved ? JSON.parse(planningSaved) : {};

            const congesSaved = localStorage.getItem('planning_conges');
            this.conges = congesSaved ? JSON.parse(congesSaved) : [];

            const echangeSaved = localStorage.getItem('planning_echanges');
            this.historiqueEchanges = echangeSaved ? JSON.parse(echangeSaved) : [];

            const radiosSaved = localStorage.getItem('planning_radios');
            this.radios = radiosSaved ? JSON.parse(radiosSaved) : this.initRadiosParDefaut();

            const paniqueSaved = localStorage.getItem('planning_codesPanique');
            this.codesPanique = paniqueSaved ? JSON.parse(paniqueSaved) : [];

            const avertissementsSaved = localStorage.getItem('planning_avertissements');
            this.avertissements = avertissementsSaved ? JSON.parse(avertissementsSaved) : [];

            const feriesSaved = localStorage.getItem('planning_joursFeries');
            this.joursFeries = feriesSaved ? JSON.parse(feriesSaved) : [...JOURS_FERIES_2026];

            // Initialiser les statistiques du dashboard
            this.afficherDashboard();
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            this.agents = [];
        }
    }

    saveData() {
        try {
            localStorage.setItem('planning_agents', JSON.stringify(this.agents));
            localStorage.setItem('planning_shifts', JSON.stringify(this.planning));
            localStorage.setItem('planning_conges', JSON.stringify(this.conges));
            localStorage.setItem('planning_echanges', JSON.stringify(this.historiqueEchanges));
            localStorage.setItem('planning_radios', JSON.stringify(this.radios));
            localStorage.setItem('planning_codesPanique', JSON.stringify(this.codesPanique));
            localStorage.setItem('planning_avertissements', JSON.stringify(this.avertissements));
            localStorage.setItem('planning_joursFeries', JSON.stringify(this.joursFeries));
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }
    }

    initRadiosParDefaut() {
        return [
            { id: 'RAD001', modele: 'Motorola XT460', statut: 'DISPONIBLE' },
            { id: 'RAD002', modele: 'Motorola XT460', statut: 'DISPONIBLE' },
            { id: 'RAD003', modele: 'Motorola XT460', statut: 'DISPONIBLE' },
            { id: 'RAD004', modele: 'Motorola XT460', statut: 'DISPONIBLE' },
            { id: 'RAD005', modele: 'Motorola XT460', statut: 'DISPONIBLE' }
        ];
    }

    // =========================================================================
    // LOGIQUE DES CYCLES ET SHIFTS
    // =========================================================================

    cycleStandard8Jours(jourCycle) {
        const cycle = ['1', '1', '2', '2', '3', '3', 'R', 'R'];
        return cycle[jourCycle % 8];
    }

    getDecalageGroupe(codeGroupe) {
        switch(codeGroupe.toUpperCase()) {
            case 'A': return 0;
            case 'B': return 2;
            case 'C': return 4;
            case 'D': return 6;
            default: return 0;
        }
    }

    cycleGroupeE(date, codeAgent) {
        const jourDate = new Date(date);
        const jourSemaine = jourDate.getDay();
        
        if (jourSemaine === 0) return 'R';
        
        const agentsGroupeE = this.agents.filter(a => a.groupe === 'E' && a.statut === 'actif');
        const indexAgent = agentsGroupeE.findIndex(a => a.code === codeAgent);
        
        if (indexAgent === -1) return 'R';
        
        const numSemaine = this.getWeekNumber(jourDate);
        const jourPair = (jourSemaine % 2 === 0);
        
        if (indexAgent === 0) {
            if (numSemaine % 2 !== 0) {
                return jourPair ? '1' : '2';
            } else {
                return jourPair ? '2' : '1';
            }
        }
        
        if (indexAgent === 1) {
            if (numSemaine % 2 !== 0) {
                return jourPair ? '2' : '1';
            } else {
                return jourPair ? '1' : '2';
            }
        }
        
        return (indexAgent + numSemaine) % 2 === 0 ? '1' : '2';
    }

    getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    getShiftTheorique(codeAgent, dateStr) {
        const agent = this.agents.find(a => a.code === codeAgent);
        if (!agent) return '-';
        
        const date = new Date(dateStr);
        const dateEntree = new Date(agent.date_entree || DATE_AFFECTATION_BASE);
        
        if (agent.date_sortie && date >= new Date(agent.date_sortie)) {
            return '-';
        }
        
        if (date < dateEntree) {
            return '-';
        }
        
        if (agent.groupe === 'E') {
            return this.cycleGroupeE(dateStr, codeAgent);
        }
        
        if (['A', 'B', 'C', 'D'].includes(agent.groupe)) {
            const deltaJours = Math.floor((date - dateEntree) / (1000 * 60 * 60 * 24));
            const decalage = this.getDecalageGroupe(agent.groupe);
            const jourCycleDecale = deltaJours + decalage;
            return this.cycleStandard8Jours(jourCycleDecale);
        }
        
        return 'R';
    }

    // =========================================================================
    // GESTION DES CONGÉS ET ABSENCES
    // =========================================================================

    ajouterCongePeriode(codeAgent, dateDebut, dateFin, type = 'C') {
        const conge = {
            code_agent: codeAgent,
            date_debut: dateDebut,
            date_fin: dateFin,
            date_creation: new Date().toISOString().split('T')[0],
            type: type
        };
        
        this.conges.push(conge);
        this.saveData();
        this.afficherListeConges();
        return conge;
    }

    ajouterAbsencePonctuelle(codeAgent, dateAbsence, typeAbsence) {
        return this.ajouterCongePeriode(codeAgent, dateAbsence, dateAbsence, typeAbsence);
    }

    supprimerCongePeriode(codeAgent, dateDebut, dateFin) {
        this.conges = this.conges.filter(c => 
            !(c.code_agent === codeAgent && 
              c.date_debut === dateDebut && 
              c.date_fin === dateFin)
        );
        this.saveData();
        this.afficherListeConges();
    }

    estEnConge(codeAgent, dateStr) {
        return this.conges.some(c => 
            c.code_agent === codeAgent && 
            dateStr >= c.date_debut && 
            dateStr <= c.date_fin
        );
    }

    // =========================================================================
    // CALCUL DU SHIFT EFFECTIF
    // =========================================================================

    getShiftEffectif(codeAgent, dateStr) {
        const key = `${codeAgent}_${dateStr}`;
        
        // Si déjà calculé
        if (this.planning[key]) {
            return this.planning[key];
        }
        
        // Vérifier les congés
        if (this.estEnConge(codeAgent, dateStr)) {
            const date = new Date(dateStr);
            const conge = this.conges.find(c => 
                c.code_agent === codeAgent && 
                dateStr >= c.date_debut && 
                dateStr <= c.date_fin
            );
            
            if (date.getDay() === 0) {
                this.planning[key] = 'R';
            } else {
                this.planning[key] = conge?.type || 'C';
            }
            
            this.saveData();
            return this.planning[key];
        }
        
        // Vérifier les jours fériés
        if (this.joursFeries.includes(dateStr)) {
            this.planning[key] = 'F';
            this.saveData();
            return 'F';
        }
        
        // Calcul théorique
        const shift = this.getShiftTheorique(codeAgent, dateStr);
        this.planning[key] = shift;
        this.saveData();
        return shift;
    }

    // =========================================================================
    // GESTION DES ÉCHANGES DE SHIFTS
    // =========================================================================

    previsualiserEchange() {
        const agent1 = document.getElementById('echange-agent1').value;
        const agent2 = document.getElementById('echange-agent2').value;
        const dateEchange = document.getElementById('echange-date').value;
        
        if (!agent1 || !agent2 || !dateEchange) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        if (agent1 === agent2) {
            alert('Les deux agents doivent être différents');
            return;
        }
        
        const shift1 = this.getShiftEffectif(agent1, dateEchange);
        const shift2 = this.getShiftEffectif(agent2, dateEchange);
        
        const apercu = document.getElementById('apercu-echange');
        const details = document.getElementById('details-echange');
        
        if (shift1 === '-' || shift2 === '-') {
            details.innerHTML = `
                <div style="color: #dc2626;">
                    ❌ Impossible d'échanger : un des agents n'est pas planifié à cette date
                </div>
            `;
            apercu.style.display = 'block';
            return;
        }
        
        details.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div style="text-align: center; padding: 10px; background: #f1f5f9; border-radius: 8px;">
                    <strong>${agent1}</strong><br>
                    <span style="font-size: 24px; font-weight: bold;">${shift1}</span><br>
                    <small>→ deviendra →</small><br>
                    <span style="font-size: 24px; font-weight: bold; color: #10b981;">${shift2}</span>
                </div>
                <div style="text-align: center; padding: 10px; background: #f1f5f9; border-radius: 8px;">
                    <strong>${agent2}</strong><br>
                    <span style="font-size: 24px; font-weight: bold;">${shift2}</span><br>
                    <small>→ deviendra →</small><br>
                    <span style="font-size: 24px; font-weight: bold; color: #10b981;">${shift1}</span>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #64748b; text-align: center;">
                Date: ${dateEchange}
            </div>
        `;
        
        apercu.style.display = 'block';
    }

    validerEchange() {
        const agent1 = document.getElementById('echange-agent1').value;
        const agent2 = document.getElementById('echange-agent2').value;
        const dateEchange = document.getElementById('echange-date').value;
        
        if (!agent1 || !agent2 || !dateEchange) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        const shift1 = this.getShiftEffectif(agent1, dateEchange);
        const shift2 = this.getShiftEffectif(agent2, dateEchange);
        
        if (shift1 === '-' || shift2 === '-') {
            alert('Impossible d\'échanger : un des agents n\'est pas planifié à cette date');
            return;
        }
        
        const key1 = `${agent1}_${dateEchange}`;
        const key2 = `${agent2}_${dateEchange}`;
        
        this.planning[key1] = shift2;
        this.planning[key2] = shift1;
        
        const echange = {
            agent1: agent1,
            agent2: agent2,
            date: dateEchange,
            ancien_shift1: shift1,
            ancien_shift2: shift2,
            date_echange: new Date().toISOString(),
            nouveau_shift1: shift2,
            nouveau_shift2: shift1
        };
        
        this.historiqueEchanges.push(echange);
        this.saveData();
        
        this.afficherHistoriqueEchanges();
        
        document.getElementById('echange-agent1').value = '';
        document.getElementById('echange-agent2').value = '';
        document.getElementById('echange-date').value = '';
        document.getElementById('apercu-echange').style.display = 'none';
        
        alert(`✅ Échange effectué : ${agent1} prend ${shift2} et ${agent2} prend ${shift1} le ${dateEchange}`);
    }

    // =========================================================================
    // GESTION DES AGENTS
    // =========================================================================

    ajouterAgent(code, nom, prenom, groupe) {
        const nouvelAgent = {
            code: code.toUpperCase(),
            nom: nom,
            prenom: prenom,
            groupe: groupe.toUpperCase(),
            date_entree: DATE_AFFECTATION_BASE,
            date_sortie: null,
            statut: 'actif'
        };
        
        const index = this.agents.findIndex(a => a.code === nouvelAgent.code);
        if (index !== -1) {
            this.agents[index] = nouvelAgent;
        } else {
            this.agents.push(nouvelAgent);
        }
        
        this.saveData();
        this.initialiserSelectAgents();
        return nouvelAgent;
    }

    // =========================================================================
    // CALCUL DU PLANNING
    // =========================================================================

    calculerPlanningMensuel(mois, annee, groupeFiltre = 'all') {
        const joursMois = new Date(annee, mois, 0).getDate();
        const agentsFiltres = groupeFiltre === 'all' 
            ? this.agents.filter(a => a.statut === 'actif')
            : this.agents.filter(a => a.groupe === groupeFiltre && a.statut === 'actif');
        
        const planning = {
            mois: mois,
            annee: annee,
            jours: [],
            agents: []
        };
        
        for (let jour = 1; jour <= joursMois; jour++) {
            const date = new Date(annee, mois - 1, jour);
            const dateStr = `${annee}-${mois.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;
            
            planning.jours.push({
                numero: jour,
                date: dateStr,
                jour_semaine: JOURS_FRANCAIS[date.getDay()],
                ferie: this.joursFeries.includes(dateStr)
            });
        }
        
        agentsFiltres.forEach(agent => {
            const agentPlanning = {
                code: agent.code,
                nom_complet: `${agent.nom} ${agent.prenom}`,
                groupe: agent.groupe,
                shifts: []
            };
            
            for (let jour = 1; jour <= joursMois; jour++) {
                const dateStr = `${annee}-${mois.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;
                const shift = this.getShiftEffectif(agent.code, dateStr);
                agentPlanning.shifts.push(shift);
            }
            
            planning.agents.push(agentPlanning);
        });
        
        return planning;
    }

    // =========================================================================
    // INTERFACE UTILISATEUR
    // =========================================================================

    setupEventListeners() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.showTab(tabName);
            });
        });
        
        document.getElementById('month-select')?.addEventListener('change', () => this.afficherPlanning());
        document.getElementById('year-select')?.addEventListener('change', () => this.afficherPlanning());
        document.getElementById('groupe-select')?.addEventListener('change', () => this.afficherPlanning());
        
        document.addEventListener('DOMContentLoaded', () => {
            this.showTab('dashboard');
            this.afficherDashboard();
            this.afficherPlanning();
            this.initialiserSelectAgents();
            this.afficherListeConges();
            this.afficherHistoriqueEchanges();
            this.afficherStatutRadios();
            this.afficherCodesPanique();
            this.afficherAvertissements();
            this.afficherJoursFeries();
            this.afficherClassement();
        });
    }

    showTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const tabElement = document.getElementById(`${tabName}-tab`);
        if (tabElement) {
            tabElement.classList.add('active');
        }
        
        document.querySelector(`.nav-tab[data-tab="${tabName}"]`)?.classList.add('active');
        
        switch(tabName) {
            case 'dashboard':
                this.afficherDashboard();
                break;
            case 'planning':
                this.afficherPlanning();
                break;
            case 'agents':
                this.afficherListeAgents();
                break;
            case 'absences':
                this.afficherListeConges();
                break;
            case 'echanges':
                this.afficherHistoriqueEchanges();
                break;
            case 'stats':
                this.afficherStatistiques();
                break;
            case 'radios':
                this.afficherStatutRadios();
                break;
            case 'panique':
                this.afficherCodesPanique();
                break;
            case 'avertissements':
                this.afficherAvertissements();
                break;
            case 'feries':
                this.afficherJoursFeries();
                break;
            case 'classement':
                this.afficherClassement();
                break;
        }
    }

    afficherDashboard() {
        const agentsActifs = this.agents.filter(a => a.statut === 'actif');
        const aujourdhui = new Date().toISOString().split('T')[0];
        
        let presentsAujourdhui = 0;
        agentsActifs.forEach(agent => {
            const shift = this.getShiftEffectif(agent.code, aujourdhui);
            if (['1', '2', '3'].includes(shift)) {
                presentsAujourdhui++;
            }
        });
        
        const groupesUniques = [...new Set(agentsActifs.map(a => a.groupe))].length;
        
        document.getElementById('total-agents').textContent = agentsActifs.length;
        document.getElementById('present-today').textContent = presentsAujourdhui;
        document.getElementById('total-groupes').textContent = groupesUniques;
        document.getElementById('en-service').textContent = agentsActifs.length;
        
        // Afficher les stats des radios
        this.afficherStatsRadios();
    }

    afficherStatsRadios() {
        const radiosStats = this.radios.reduce((stats, radio) => {
            stats[radio.statut] = (stats[radio.statut] || 0) + 1;
            stats.total = (stats.total || 0) + 1;
            return stats;
        }, {});
        
        const container = document.getElementById('radios-stats');
        if (container) {
            container.innerHTML = `
                <h3 style="margin-bottom: 15px; color: var(--dark);">📻 Statut des Radios</h3>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <div style="flex: 1; background: #10b981; color: white; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px;">Disponibles</div>
                        <div style="font-size: 24px; font-weight: bold;">${radiosStats.DISPONIBLE || 0}</div>
                    </div>
                    <div style="flex: 1; background: #3b82f6; color: white; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px;">Attribuées</div>
                        <div style="font-size: 24px; font-weight: bold;">${radiosStats.ATTRIBUÉE || 0}</div>
                    </div>
                    <div style="flex: 1; background: #ef4444; color: white; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px;">HS/Réparation</div>
                        <div style="font-size: 24px; font-weight: bold;">${(radiosStats.HS || 0) + (radiosStats.RÉPARATION || 0)}</div>
                    </div>
                </div>
            `;
        }
    }

    afficherPlanning() {
        const mois = parseInt(document.getElementById('month-select')?.value || new Date().getMonth() + 1);
        const annee = parseInt(document.getElementById('year-select')?.value || 2026);
        const groupeFiltre = document.getElementById('groupe-select')?.value || 'all';
        
        const planning = this.calculerPlanningMensuel(mois, annee, groupeFiltre);
        const container = document.getElementById('planning-result');
        
        if (!container) return;
        
        if (planning.agents.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <p>Aucun agent dans ce groupe</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div style="overflow-x: auto;">
                <table class="planning-table">
                    <thead>
                        <tr>
                            <th style="min-width: 150px; position: sticky; left: 0; background: #f8fafc;">Agent / Groupe</th>
        `;
        
        planning.jours.forEach(jour => {
            const estDimanche = new Date(jour.date).getDay() === 0;
            const estFerie = this.joursFeries.includes(jour.date);
            let style = '';
            if (estDimanche) style = 'background: #fef2f2; color: #dc2626;';
            if (estFerie) style = 'background: #fee2e2; color: #dc2626;';
            html += `<th style="${style} min-width: 50px;">${jour.numero}<br><small>${jour.jour_semaine}</small></th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        planning.agents.forEach(agent => {
            const groupeColor = this.getGroupeColor(agent.groupe);
            
            html += `
                <tr>
                    <td style="text-align: left; padding-left: 15px; background: #f8fafc; position: sticky; left: 0;">
                        <div style="font-weight: 700;">${agent.code}</div>
                        <div style="font-size: 12px; color: #64748b;">${agent.nom_complet}</div>
                        <span style="background: ${groupeColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600;">
                            G ${agent.groupe}
                        </span>
                    </td>
            `;
            
            agent.shifts.forEach((shift, index) => {
                const jourInfo = planning.jours[index];
                const estDimanche = new Date(jourInfo.date).getDay() === 0;
                const estFerie = this.joursFeries.includes(jourInfo.date);
                let style = '';
                if (estDimanche) style = 'background: #fef2f2;';
                if (estFerie) style = 'background: #fee2e2;';
                const shiftClass = `shift-${shift}`;
                
                html += `
                    <td style="${style}">
                        <span class="shift-badge ${shiftClass}">${shift}</span>
                    </td>
                `;
            });
            
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    afficherListeAgents() {
        const container = document.getElementById('agents-list');
        if (!container) return;
        
        const agentsActifs = this.agents.filter(a => a.statut === 'actif');
        
        if (agentsActifs.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <p>Aucun agent enregistré</p>
                    <button onclick="showTab('add')" style="margin-top: 10px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px;">
                        ➕ Ajouter le premier agent
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: grid; gap: 12px;">';
        
        agentsActifs.forEach(agent => {
            const groupeColor = this.getGroupeColor(agent.groupe);
            
            html += `
                <div style="background: white; border-radius: 12px; padding: 16px; border: 2px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 16px;">${agent.code}</strong>
                        <span style="background: ${groupeColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                            Groupe ${agent.groupe}
                        </span>
                    </div>
                    <div style="font-size: 14px; color: #1e293b;">
                        ${agent.nom} ${agent.prenom}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                        Entré le: ${agent.date_entree}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    afficherListeConges() {
        const container = document.getElementById('liste-conges');
        if (!container) return;
        
        if (this.conges.length === 0) {
            container.innerHTML = '<p style="color: #64748b; text-align: center;">Aucun congé enregistré</p>';
            return;
        }
        
        let html = '<div style="display: grid; gap: 10px;">';
        
        this.conges.slice().reverse().forEach((conge, index) => {
            const agent = this.agents.find(a => a.code === conge.code_agent);
            const duree = Math.floor((new Date(conge.date_fin) - new Date(conge.date_debut)) / (1000 * 60 * 60 * 24)) + 1;
            let typeColor = '#0ea5e9';
            let typeText = 'Congé';
            
            if (conge.type === 'M') {
                typeColor = '#ef4444';
                typeText = 'Maladie';
            } else if (conge.type === 'A') {
                typeColor = '#8b5cf6';
                typeText = 'Autre';
            }
            
            html += `
                <div style="background: white; border-left: 4px solid ${typeColor}; padding: 12px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <div>
                            <strong>${agent?.nom || conge.code_agent}</strong>
                            <span style="background: ${typeColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-left: 8px;">
                                ${typeText}
                            </span>
                        </div>
                        <button onclick="supprimerConge('${conge.code_agent}', '${conge.date_debut}', '${conge.date_fin}')" 
                                style="padding: 4px 8px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; font-size: 11px;">
                            Supprimer
                        </button>
                    </div>
                    <div style="font-size: 13px; color: #64748b;">
                        ${conge.date_debut} → ${conge.date_fin} (${duree} jour${duree > 1 ? 's' : ''})
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    afficherHistoriqueEchanges() {
        const container = document.getElementById('historique-echanges');
        if (!container) return;
        
        if (this.historiqueEchanges.length === 0) {
            container.innerHTML = '<p style="color: #64748b; text-align: center;">Aucun échange enregistré</p>';
            return;
        }
        
        let html = '<div style="display: grid; gap: 10px;">';
        
        this.historiqueEchanges.slice().reverse().forEach(echange => {
            html += `
                <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <strong>${echange.date}</strong>
                        <small style="color: #64748b;">${new Date(echange.date_echange).toLocaleDateString()}</small>
                    </div>
                    <div style="font-size: 13px;">
                        🔄 ${echange.agent1} (${echange.ancien_shift1} → ${echange.nouveau_shift1}) ↔ 
                        ${echange.agent2} (${echange.ancien_shift2} → ${echange.nouveau_shift2})
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    afficherStatutRadios() {
        const container = document.getElementById('radios-list');
        if (!container) return;
        
        let html = '<div style="display: grid; gap: 10px;">';
        
        this.radios.forEach(radio => {
            let statutColor = '#10b981';
            if (radio.statut === 'ATTRIBUÉE') statutColor = '#3b82f6';
            if (radio.statut === 'HS') statutColor = '#ef4444';
            if (radio.statut === 'RÉPARATION') statutColor = '#f59e0b';
            
            html += `
                <div style="background: white; border-left: 4px solid ${statutColor}; padding: 12px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <div>
                            <strong>${radio.id}</strong>
                            <span style="background: ${statutColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-left: 8px;">
                                ${radio.statut}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #64748b;">
                            ${radio.modele}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    afficherCodesPanique() {
        const container = document.getElementById('panique-list');
        if (!container) return;
        
        if (this.codesPanique.length === 0) {
            container.innerHTML = '<p style="color: #64748b; text-align: center;">Aucun code panique enregistré</p>';
            return;
        }
        
        let html = '<div style="display: grid; gap: 10px;">';
        
        this.codesPanique.forEach(code => {
            const agent = this.agents.find(a => a.code === code.code_agent);
            html += `
                <div style="background: white; border-left: 4px solid #ef4444; padding: 12px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <div>
                            <strong>${code.code_agent}</strong>
                            <span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-left: 8px;">
                                CODE PANIQUE
                            </span>
                        </div>
                    </div>
                    <div style="font-size: 13px; color: #64748b;">
                        Code: <strong style="color: #1e293b;">${code.code_panique}</strong>
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                        Poste: ${code.poste_nom} | Agent: ${agent ? `${agent.nom} ${agent.prenom}` : code.code_agent}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    afficherAvertissements() {
        const container = document.getElementById('avertissements-list');
        if (!container) return;
        
        if (this.avertissements.length === 0) {
            container.innerHTML = '<p style="color: #64748b; text-align: center;">Aucun avertissement enregistré</p>';
            return;
        }
        
        let html = '<div style="display: grid; gap: 10px;">';
        
        this.avertissements.slice().reverse().forEach(av => {
            let typeColor = '#f59e0b';
            if (av.type === 'ECRIT') typeColor = '#ef4444';
            if (av.type === 'MISE_A_PIED') typeColor = '#dc2626';
            
            const agent = this.agents.find(a => a.code === av.code_agent);
            
            html += `
                <div style="background: white; border-left: 4px solid ${typeColor}; padding: 12px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <div>
                            <strong>${agent ? `${agent.nom} ${agent.prenom}` : av.code_agent}</strong>
                            <span style="background: ${typeColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-left: 8px;">
                                ${av.type}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #64748b;">
                            ${av.date}
                        </div>
                    </div>
                    <div style="font-size: 13px; color: #1e293b; margin-top: 5px;">
                        ${av.description}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    afficherJoursFeries() {
        const container = document.getElementById('feries-dynamic-list');
        if (!container) return;
        
        let html = '<div style="display: grid; gap: 10px;">';
        
        this.joursFeries.forEach(jour => {
            const date = new Date(jour);
            const jourSemaine = JOURS_FRANCAIS[date.getDay()];
            
            html += `
                <div style="background: white; border-left: 4px solid #ef4444; padding: 12px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${jour}</strong>
                            <span style="color: #64748b; margin-left: 10px;">${jourSemaine}</span>
                        </div>
                        <span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">
                            FÉRIÉ
                        </span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    afficherClassement() {
        const container = document.getElementById('classement-result');
        if (!container) return;
        
        const agentsActifs = this.agents.filter(a => a.statut === 'actif');
        
        if (agentsActifs.length === 0) {
            container.innerHTML = '<p style="color: #64748b; text-align: center;">Aucun agent pour le classement</p>';
            return;
        }
        
        // Simuler un classement simple
        let html = '<div style="display: grid; gap: 10px;">';
        
        agentsActifs.forEach((agent, index) => {
            const groupeColor = this.getGroupeColor(agent.groupe);
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            
            html += `
                <div style="background: white; border-radius: 10px; padding: 15px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 20px; margin-right: 10px;">${medal}</span>
                            <strong>${agent.code}</strong>
                            <span style="background: ${groupeColor}; color: white; padding: 2px 10px; border-radius: 10px; font-size: 11px; margin-left: 10px;">
                                G ${agent.groupe}
                            </span>
                        </div>
                        <div style="font-size: 18px; font-weight: bold; color: #059669;">
                            ${Math.floor(Math.random() * 20) + 10} CPA
                        </div>
                    </div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 5px;">
                        ${agent.nom} ${agent.prenom}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    afficherStatistiques() {
        const container = document.getElementById('stats-result');
        if (!container) return;
        
        const agentsActifs = this.agents.filter(a => a.statut === 'actif');
        const groupes = {};
        
        agentsActifs.forEach(agent => {
            groupes[agent.groupe] = (groupes[agent.groupe] || 0) + 1;
        });
        
        let html = '<div style="display: grid; gap: 15px;">';
        
        for (const [groupe, count] of Object.entries(groupes)) {
            const couleur = this.getGroupeColor(groupe);
            html += `
                <div style="background: white; border-left: 4px solid ${couleur}; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="font-size: 16px;">Groupe ${groupe}</strong>
                            <div style="font-size: 14px; color: #64748b; margin-top: 4px;">${count} agent${count > 1 ? 's' : ''}</div>
                        </div>
                        <div style="font-size: 24px; font-weight: 700; color: ${couleur};">${count}</div>
                    </div>
                </div>
            `;
        }
        
        html += `
            <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 14px; opacity: 0.9;">TOTAL AGENTS ACTIFS</div>
                <div style="font-size: 40px; font-weight: 800; margin: 10px 0;">${agentsActifs.length}</div>
                <div style="font-size: 12px; opacity: 0.8;">Mis à jour: ${new Date().toLocaleDateString()}</div>
            </div>
        `;
        
        html += '</div>';
        container.innerHTML = html;
    }

    initialiserSelectAgents() {
        const selectIds = [
            'absence-agent', 'absence-ponctuelle-agent', 
            'echange-agent1', 'echange-agent2',
            'panique-agent', 'avertissement-agent'
        ];
        
        selectIds.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Sélectionner un agent</option>';
                this.agents
                    .filter(agent => agent.statut === 'actif')
                    .forEach(agent => {
                        const option = document.createElement('option');
                        option.value = agent.code;
                        option.textContent = `${agent.code} - ${agent.nom} ${agent.prenom}`;
                        select.appendChild(option);
                    });
            }
        });
    }

    getGroupeColor(groupe) {
        const couleurs = {
            'A': '#3b82f6',
            'B': '#10b981',
            'C': '#8b5cf6',
            'D': '#f59e0b',
            'E': '#ef4444'
        };
        return couleurs[groupe] || '#64748b';
    }

    // =========================================================================
    // MÉTHODES POUR LES FORMULAIRES
    // =========================================================================

    ajouterAgentViaFormulaire() {
        const code = document.getElementById('code-agent')?.value;
        const nom = document.getElementById('nom-agent')?.value;
        const prenom = document.getElementById('prenom-agent')?.value;
        const groupe = document.getElementById('groupe-agent')?.value;
        
        if (!code || !nom || !prenom || !groupe) {
            alert('Tous les champs sont obligatoires');
            return;
        }
        
        this.ajouterAgent(code, nom, prenom, groupe);
        
        document.getElementById('code-agent').value = '';
        document.getElementById('nom-agent').value = '';
        document.getElementById('prenom-agent').value = '';
        document.getElementById('groupe-agent').value = '';
        
        alert(`✅ Agent ${code} ajouté avec succès !`);
        this.showTab('agents');
    }

    ajouterCongeViaFormulaire() {
        const codeAgent = document.getElementById('absence-agent').value;
        const dateDebut = document.getElementById('date-debut').value;
        const dateFin = document.getElementById('date-fin').value;
        const type = document.getElementById('type-conge')?.value || 'C';
        
        if (!codeAgent || !dateDebut || !dateFin) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        if (dateDebut > dateFin) {
            alert('La date de début doit être avant la date de fin');
            return;
        }
        
        this.ajouterCongePeriode(codeAgent, dateDebut, dateFin, type);
        
        document.getElementById('absence-agent').value = '';
        document.getElementById('date-debut').value = '';
        document.getElementById('date-fin').value = '';
        
        alert(`✅ Congé ${type} ajouté pour ${codeAgent} du ${dateDebut} au ${dateFin}`);
    }

    ajouterAbsenceViaFormulaire() {
        const codeAgent = document.getElementById('absence-ponctuelle-agent').value;
        const dateAbsence = document.getElementById('absence-date').value;
        const typeAbsence = document.getElementById('type-absence').value;
        
        if (!codeAgent || !dateAbsence || !typeAbsence) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        this.ajouterAbsencePonctuelle(codeAgent, dateAbsence, typeAbsence);
        
        document.getElementById('absence-ponctuelle-agent').value = '';
        document.getElementById('absence-date').value = '';
        document.getElementById('type-absence').value = '';
        
        alert(`✅ Absence ${typeAbsence} enregistrée pour ${codeAgent} le ${dateAbsence}`);
    }

    ajouterCodePaniqueViaFormulaire() {
        const codeAgent = document.getElementById('panique-agent').value;
        const codePanique = document.getElementById('code-panique').value;
        const poste = document.getElementById('poste-panique').value;
        
        if (!codeAgent || !codePanique || !poste) {
            alert('Tous les champs sont obligatoires');
            return;
        }
        
        const code = {
            code_agent: codeAgent,
            code_panique: codePanique,
            poste_nom: poste,
            date_creation: new Date().toISOString().split('T')[0]
        };
        
        this.codesPanique.push(code);
        this.saveData();
        this.afficherCodesPanique();
        
        document.getElementById('panique-agent').value = '';
        document.getElementById('code-panique').value = '';
        document.getElementById('poste-panique').value = '';
        
        alert(`✅ Code panique ${codePanique} enregistré pour ${codeAgent}`);
    }

    ajouterAvertissementViaFormulaire() {
        const codeAgent = document.getElementById('avertissement-agent').value;
        const type = document.getElementById('type-avertissement').value;
        const description = document.getElementById('description-avertissement').value;
        
        if (!codeAgent || !type || !description) {
            alert('Tous les champs sont obligatoires');
            return;
        }
        
        const avertissement = {
            code_agent: codeAgent,
            type: type.toUpperCase(),
            description: description,
            date: new Date().toISOString().split('T')[0],
            statut: 'ACTIF'
        };
        
        this.avertissements.push(avertissement);
        this.saveData();
        this.afficherAvertissements();
        
        document.getElementById('avertissement-agent').value = '';
        document.getElementById('type-avertissement').value = '';
        document.getElementById('description-avertissement').value = '';
        
        alert(`✅ Avertissement ${type} enregistré pour ${codeAgent}`);
    }

    ajouterJourFerieViaFormulaire() {
        const date = document.getElementById('ferie-date').value;
        const description = document.getElementById('ferie-description').value;
        
        if (!date || !description) {
            alert('Tous les champs sont obligatoires');
            return;
        }
        
        this.joursFeries.push(date);
        this.saveData();
        this.afficherJoursFeries();
        
        document.getElementById('ferie-date').value = '';
        document.getElementById('ferie-description').value = '';
        
        alert(`✅ Jour férié ajouté : ${description} le ${date}`);
    }

    // =========================================================================
    // EXPORT DE DONNÉES
    // =========================================================================

    exporterExcelComplet() {
        try {
            let csv = "Type,Code,Données\n";
            
            csv += "AGENTS\n";
            csv += "Code,Nom,Prénom,Groupe,Date Entrée,Date Sortie,Statut\n";
            this.agents.forEach(agent => {
                csv += `"${agent.code}","${agent.nom}","${agent.prenom}","${agent.groupe}","${agent.date_entree}","${agent.date_sortie || ''}","${agent.statut}"\n`;
            });
            
            csv += "\nPLANNING\n";
            csv += "Code Agent,Date,Shift\n";
            Object.entries(this.planning).forEach(([key, shift]) => {
                const [code, date] = key.split('_');
                csv += `"${code}","${date}","${shift}"\n`;
            });
            
            csv += "\nCONGES\n";
            csv += "Code Agent,Date Début,Date Fin,Type,Date Création\n";
            this.conges.forEach(conge => {
                csv += `"${conge.code_agent}","${conge.date_debut}","${conge.date_fin}","${conge.type || 'C'}","${conge.date_creation}"\n`;
            });
            
            csv += "\nECHANGES\n";
            csv += "Agent 1,Agent 2,Date,Ancien Shift 1,Ancien Shift 2,Nouveau Shift 1,Nouveau Shift 2,Date Echange\n";
            this.historiqueEchanges.forEach(echange => {
                csv += `"${echange.agent1}","${echange.agent2}","${echange.date}","${echange.ancien_shift1}","${echange.ancien_shift2}","${echange.nouveau_shift1}","${echange.nouveau_shift2}","${echange.date_echange}"\n`;
            });
            
            const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `planning_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert(`✅ Export réussi !\n📊 ${this.agents.length} agents\n📅 ${Object.keys(this.planning).length} shifts\n📋 ${this.conges.length} congés`);
            
        } catch (error) {
            console.error('Erreur export:', error);
            alert('❌ Erreur lors de l\'export');
        }
    }

    exporterPlanningMensuel() {
        const mois = parseInt(document.getElementById('export-mois').value);
        const annee = parseInt(document.getElementById('export-annee').value);
        
        const planning = this.calculerPlanningMensuel(mois, annee, 'all');
        
        let csv = `Planning Mensuel ${mois}/${annee}\n\n`;
        csv += "Agent;Groupe;";
        
        planning.jours.forEach(jour => {
            csv += jour.numero + " " + jour.jour_semaine + ";";
        });
        csv += "\n";
        
        planning.agents.forEach(agent => {
            csv += agent.code + ";" + agent.groupe + ";";
            agent.shifts.forEach(shift => {
                csv += shift + ";";
            });
            csv += "\n";
        });
        
        csv += "\n\nLégende:\n";
        csv += "1=Matin, 2=Après-midi, 3=Nuit, R=Repos, C=Congé, M=Maladie, A=Autre absence, F=Férié\n";
        
        const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planning_${mois}_${annee}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`✅ Planning ${mois}/${annee} exporté !\n${planning.agents.length} agents`);
    }

    exporterStatistiques() {
        const aujourdhui = new Date();
        const mois = aujourdhui.getMonth() + 1;
        const annee = aujourdhui.getFullYear();
        
        let csv = `Statistiques Agents ${mois}/${annee}\n\n`;
        csv += "Code;Nom;Prénom;Groupe;Matin (1);Après-midi (2);Nuit (3);Repos (R);Congés (C);Maladie (M);Autre (A);Fériés (F);Total Opérationnel\n";
        
        this.agents.forEach(agent => {
            if (agent.statut === 'actif') {
                // Stats simulées pour l'exemple
                csv += `${agent.code};${agent.nom};${agent.prenom};${agent.groupe};`;
                csv += `15;12;8;5;2;1;0;0;35\n`;
            }
        });
        
        const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistiques_${mois}_${annee}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Statistiques exportées !');
    }

    exporterBackupJSON() {
        const backup = {
            agents: this.agents,
            planning: this.planning,
            conges: this.conges,
            historique_echanges: this.historiqueEchanges,
            radios: this.radios,
            codes_panique: this.codesPanique,
            avertissements: this.avertissements,
            jours_feries: this.joursFeries,
            date_backup: new Date().toISOString(),
            version: '1.0'
        };
        
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planning_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Backup JSON créé !');
    }

    importerBackupJSON() {
        if (!confirm('⚠️ Attention : Cela écrasera toutes vos données actuelles. Continuer ?')) {
            return;
        }
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const backup = JSON.parse(event.target.result);
                    
                    if (backup.agents) {
                        this.agents = backup.agents;
                        localStorage.setItem('planning_agents', JSON.stringify(backup.agents));
                    }
                    
                    if (backup.planning) {
                        this.planning = backup.planning;
                        localStorage.setItem('planning_shifts', JSON.stringify(backup.planning));
                    }
                    
                    if (backup.conges) {
                        this.conges = backup.conges;
                        localStorage.setItem('planning_conges', JSON.stringify(backup.conges));
                    }
                    
                    if (backup.historique_echanges) {
                        this.historiqueEchanges = backup.historique_echanges;
                        localStorage.setItem('planning_echanges', JSON.stringify(backup.historique_echanges));
                    }
                    
                    alert(`✅ Backup restauré !\n${backup.agents?.length || 0} agents\n${backup.conges?.length || 0} congés`);
                    location.reload();
                    
                } catch (error) {
                    alert('❌ Erreur : JSON invalide');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('✅ Service Worker enregistré'))
                .catch(err => console.error('❌ Erreur Service Worker:', err));
        }
    }
}

// =========================================================================
// INITIALISATION DE L'APPLICATION
// =========================================================================

window.app = new PlanningMetier();

// Fonctions globales pour HTML
window.showTab = (tabName) => window.app.showTab(tabName);
window.addAgent = () => window.app.ajouterAgentViaFormulaire();
window.ajouterCongePeriode = () => window.app.ajouterCongeViaFormulaire();
window.ajouterAbsencePonctuelle = () => window.app.ajouterAbsenceViaFormulaire();
window.previsualiserEchange = () => window.app.previsualiserEchange();
window.validerEchange = () => window.app.validerEchange();
window.ajouterCodePanique = () => window.app.ajouterCodePaniqueViaFormulaire();
window.ajouterAvertissement = () => window.app.ajouterAvertissementViaFormulaire();
window.ajouterJourFerie = () => window.app.ajouterJourFerieViaFormulaire();

window.supprimerConge = (code, debut, fin) => {
    if (confirm(`Supprimer ce congé ?`)) {
        window.app.supprimerCongePeriode(code, debut, fin);
    }
};

window.exporterExcelComplet = () => window.app.exporterExcelComplet();
window.exporterPlanningMensuel = () => window.app.exporterPlanningMensuel();
window.exporterStatistiques = () => window.app.exporterStatistiques();
window.exporterBackupJSON = () => window.app.exporterBackupJSON();
window.importerBackupJSON = () => window.app.importerBackupJSON();
window.exportToExcel = () => window.app.exporterExcelComplet();

document.addEventListener('DOMContentLoaded', () => {
    window.app.showTab('dashboard');
    window.app.afficherDashboard();
});
