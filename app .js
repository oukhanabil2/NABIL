// Planning 2026 - Application PWA complète avec toutes les options métiers
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
// CLASSES ET FONCTIONS MÉTIER COMPLÈTES
// =========================================================================

class PlanningMetierComplet {
    constructor() {
        this.agents = [];
        this.planning = {};
        this.conges = [];
        this.historiqueEchanges = [];
        this.joursFeries = [...JOURS_FERIES_2026];
        this.codesPanique = [];
        this.radios = [];
        this.historiqueRadios = [];
        this.habillement = [];
        this.avertissements = [];
        this.init();
    }

    init() {
        this.loadAllData();
        this.setupEventListeners();
        this.setupServiceWorker();
        console.log(`✅ ${this.agents.length} agents initialisés`);
    }

    // =========================================================================
    // GESTION COMPLÈTE DES DONNÉES
    // =========================================================================

    loadAllData() {
        // Charger depuis data.js si disponible
        if (window.agentsData && window.agentsData.length > 0) {
            this.agents = window.agentsData;
            console.log(`📥 ${this.agents.length} agents chargés depuis data.js`);
        } else {
            this.agents = JSON.parse(localStorage.getItem('planning_agents')) || [];
        }

        // Charger toutes les données
        this.planning = JSON.parse(localStorage.getItem('planning_shifts')) || {};
        this.conges = JSON.parse(localStorage.getItem('planning_conges')) || [];
        this.historiqueEchanges = JSON.parse(localStorage.getItem('planning_echanges')) || [];
        this.joursFeries = JSON.parse(localStorage.getItem('jours_feries')) || [...JOURS_FERIES_2026];
        this.codesPanique = JSON.parse(localStorage.getItem('codes_panique')) || [];
        this.radios = JSON.parse(localStorage.getItem('radios')) || this.initRadiosParDefaut();
        this.historiqueRadios = JSON.parse(localStorage.getItem('historique_radios')) || [];
        this.habillement = JSON.parse(localStorage.getItem('habillement')) || [];
        this.avertissements = JSON.parse(localStorage.getItem('avertissements')) || [];
    }

    saveAllData() {
        const dataToSave = {
            agents: this.agents,
            planning: this.planning,
            conges: this.conges,
            historiqueEchanges: this.historiqueEchanges,
            joursFeries: this.joursFeries,
            codesPanique: this.codesPanique,
            radios: this.radios,
            historiqueRadios: this.historiqueRadios,
            habillement: this.habillement,
            avertissements: this.avertissements
        };

        Object.keys(dataToSave).forEach(key => {
            localStorage.setItem(`planning_${key}`, JSON.stringify(dataToSave[key]));
        });
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
    // GESTION DES AGENTS (COMPLÈTE)
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
        
        this.saveAllData();
        return nouvelAgent;
    }

    modifierAgent(code, nom, prenom, groupe) {
        const index = this.agents.findIndex(a => a.code === code.toUpperCase());
        if (index === -1) {
            return { erreur: `Agent ${code} non trouvé` };
        }

        this.agents[index] = {
            ...this.agents[index],
            nom: nom || this.agents[index].nom,
            prenom: prenom || this.agents[index].prenom,
            groupe: groupe || this.agents[index].groupe
        };

        this.saveAllData();
        return { succes: true, message: `Agent ${code} modifié` };
    }

    supprimerAgent(code) {
        const index = this.agents.findIndex(a => a.code === code.toUpperCase());
        if (index === -1) {
            return { erreur: `Agent ${code} non trouvé` };
        }

        this.agents[index].date_sortie = new Date().toISOString().split('T')[0];
        this.agents[index].statut = 'inactif';
        
        // Supprimer le planning futur
        const today = new Date().toISOString().split('T')[0];
        Object.keys(this.planning).forEach(key => {
            const [agentCode, date] = key.split('_');
            if (agentCode === code && date >= today) {
                delete this.planning[key];
            }
        });

        this.saveAllData();
        return { succes: true, message: `Agent ${code} marqué comme inactif` };
    }

    listerAgents(filtre = 'actifs') {
        switch(filtre) {
            case 'actifs':
                return this.agents.filter(a => a.statut === 'actif');
            case 'inactifs':
                return this.agents.filter(a => a.statut === 'inactif');
            case 'groupeA':
                return this.agents.filter(a => a.groupe === 'A' && a.statut === 'actif');
            case 'groupeB':
                return this.agents.filter(a => a.groupe === 'B' && a.statut === 'actif');
            case 'groupeC':
                return this.agents.filter(a => a.groupe === 'C' && a.statut === 'actif');
            case 'groupeD':
                return this.agents.filter(a => a.groupe === 'D' && a.statut === 'actif');
            case 'groupeE':
                return this.agents.filter(a => a.groupe === 'E' && a.statut === 'actif');
            default:
                return this.agents;
        }
    }

    // =========================================================================
    // LOGIQUE DES CYCLES ET SHIFTS (COMPLÈTE)
    // =========================================================================

    cycleStandard8Jours(jourCycle) {
        const cycle = ['1', '1', '2', '2', '3', '3', 'R', 'R'];
        return cycle[jourCycle % 8];
    }

    getDecalageGroupe(codeGroupe) {
        const decalages = { 'A': 0, 'B': 2, 'C': 4, 'D': 6 };
        return decalages[codeGroupe.toUpperCase()] || 0;
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
        
        // Logique spéciale groupe E
        if (indexAgent === 0) {
            return (numSemaine % 2 !== 0) ? (jourPair ? '1' : '2') : (jourPair ? '2' : '1');
        }
        
        if (indexAgent === 1) {
            return (numSemaine % 2 !== 0) ? (jourPair ? '2' : '1') : (jourPair ? '1' : '2');
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
        
        if (agent.date_sortie && date >= new Date(agent.date_sortie)) return '-';
        if (date < dateEntree) return '-';
        
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
    // GESTION DES CONGÉS ET ABSENCES (COMPLÈTE)
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
        
        // Appliquer les congés jour par jour
        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);
        
        for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const key = `${codeAgent}_${dateStr}`;
            
            if (d.getDay() === 0) { // Dimanche
                this.planning[key] = 'R';
            } else {
                this.planning[key] = type;
            }
        }
        
        this.saveAllData();
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
        
        // Supprimer du planning
        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);
        
        for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const key = `${codeAgent}_${dateStr}`;
            delete this.planning[key];
        }
        
        this.saveAllData();
    }

    estEnConge(codeAgent, dateStr) {
        return this.conges.some(c => 
            c.code_agent === codeAgent && 
            dateStr >= c.date_debut && 
            dateStr <= c.date_fin
        );
    }

    // =========================================================================
    // GESTION DES JOURS FÉRIÉS
    // =========================================================================

    ajouterJourFerie(date, description) {
        const jourFerie = {
            date: date,
            description: description,
            type: 'manuel'
        };
        
        this.joursFeries.push(date);
        
        // Appliquer aux agents
        this.agents.filter(a => a.statut === 'actif').forEach(agent => {
            const key = `${agent.code}_${date}`;
            this.planning[key] = 'F';
        });
        
        this.saveAllData();
        return jourFerie;
    }

    supprimerJourFerie(date) {
        this.joursFeries = this.joursFeries.filter(jf => jf !== date);
        
        // Supprimer du planning
        Object.keys(this.planning).forEach(key => {
            const [, dateStr] = key.split('_');
            if (dateStr === date && this.planning[key] === 'F') {
                delete this.planning[key];
            }
        });
        
        this.saveAllData();
    }

    estJourFerie(dateStr) {
        return this.joursFeries.includes(dateStr);
    }

    // =========================================================================
    // CALCUL DU SHIFT EFFECTIF (COMPLET)
    // =========================================================================

    getShiftEffectif(codeAgent, dateStr) {
        const key = `${codeAgent}_${dateStr}`;
        
        // Vérifier si déjà calculé
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
            
            this.saveAllData();
            return this.planning[key];
        }
        
        // Vérifier les jours fériés
        if (this.estJourFerie(dateStr)) {
            this.planning[key] = 'F';
            this.saveAllData();
            return 'F';
        }
        
        // Calcul théorique
        const shift = this.getShiftTheorique(codeAgent, dateStr);
        this.planning[key] = shift;
        this.saveAllData();
        return shift;
    }

    // =========================================================================
    // GESTION DES ÉCHANGES DE SHIFTS
    // =========================================================================

    echangerShifts(agent1, agent2, dateEchange) {
        const shift1 = this.getShiftEffectif(agent1, dateEchange);
        const shift2 = this.getShiftEffectif(agent2, dateEchange);
        
        if (shift1 === '-' || shift2 === '-') {
            return { erreur: "Impossible d'échanger : un des agents n'est pas planifié" };
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
            date_echange: new Date().toISOString()
        };
        
        this.historiqueEchanges.push(echange);
        this.saveAllData();
        
        return { 
            succes: true, 
            message: `Échange effectué : ${agent1} (${shift1}→${shift2}) et ${agent2} (${shift2}→${shift1})`,
            echange: echange
        };
    }

    // =========================================================================
    // GESTION DES CODES PANIQUE
    // =========================================================================

    ajouterCodePanique(codeAgent, codePanique, posteNom) {
        const code = {
            code_agent: codeAgent,
            code_panique: codePanique,
            poste_nom: posteNom,
            date_creation: new Date().toISOString().split('T')[0]
        };
        
        const index = this.codesPanique.findIndex(cp => cp.code_agent === codeAgent);
        if (index !== -1) {
            this.codesPanique[index] = code;
        } else {
            this.codesPanique.push(code);
        }
        
        this.saveAllData();
        return code;
    }

    obtenirCodesPanique() {
        return this.codesPanique.map(cp => {
            const agent = this.agents.find(a => a.code === cp.code_agent);
            return {
                ...cp,
                nom_complet: agent ? `${agent.nom} ${agent.prenom}` : cp.code_agent
            };
        });
    }

    supprimerCodePanique(codeAgent) {
        this.codesPanique = this.codesPanique.filter(cp => cp.code_agent !== codeAgent);
        this.saveAllData();
    }

    // =========================================================================
    // GESTION DU MATÉRIEL RADIO
    // =========================================================================

    ajouterRadio(idRadio, modele, statut = 'DISPONIBLE') {
        const radio = {
            id: idRadio.toUpperCase(),
            modele: modele,
            statut: statut.toUpperCase(),
            date_ajout: new Date().toISOString().split('T')[0]
        };
        
        const index = this.radios.findIndex(r => r.id === idRadio);
        if (index !== -1) {
            this.radios[index] = radio;
        } else {
            this.radios.push(radio);
        }
        
        this.saveAllData();
        return radio;
    }

    attribuerRadio(idRadio, codeAgent) {
        const radioIndex = this.radios.findIndex(r => r.id === idRadio);
        if (radioIndex === -1) {
            return { erreur: `Radio ${idRadio} non trouvée` };
        }
        
        if (this.radios[radioIndex].statut !== 'DISPONIBLE') {
            return { erreur: `Radio ${idRadio} n'est pas disponible (${this.radios[radioIndex].statut})` };
        }
        
        // Mettre à jour le statut de la radio
        this.radios[radioIndex].statut = 'ATTRIBUÉE';
        
        // Ajouter à l'historique
        const attribution = {
            id_radio: idRadio,
            code_agent: codeAgent,
            date_attribution: new Date().toISOString().split('T')[0],
            date_retour: null
        };
        
        this.historiqueRadios.push(attribution);
        this.saveAllData();
        
        return { 
            succes: true, 
            message: `Radio ${idRadio} attribuée à ${codeAgent}`,
            attribution: attribution
        };
    }

    retournerRadio(idRadio) {
        const radioIndex = this.radios.findIndex(r => r.id === idRadio);
        if (radioIndex === -1) {
            return { erreur: `Radio ${idRadio} non trouvée` };
        }
        
        // Trouver l'attribution active
        const attributionIndex = this.historiqueRadios.findIndex(hr => 
            hr.id_radio === idRadio && hr.date_retour === null
        );
        
        if (attributionIndex === -1) {
            return { erreur: `Aucune attribution active trouvée pour ${idRadio}` };
        }
        
        // Mettre à jour le statut
        this.radios[radioIndex].statut = 'DISPONIBLE';
        
        // Mettre à jour l'historique
        this.historiqueRadios[attributionIndex].date_retour = new Date().toISOString().split('T')[0];
        
        this.saveAllData();
        
        return { 
            succes: true, 
            message: `Radio ${idRadio} retournée et disponible`,
            agent: this.historiqueRadios[attributionIndex].code_agent
        };
    }

    obtenirStatutRadios() {
        const radiosAvecAgent = this.radios.map(radio => {
            const attribution = this.historiqueRadios.find(hr => 
                hr.id_radio === radio.id && hr.date_retour === null
            );
            
            const agent = attribution ? 
                this.agents.find(a => a.code === attribution.code_agent) : null;
            
            return {
                ...radio,
                agent: agent ? `${agent.code} - ${agent.nom} ${agent.prenom}` : null,
                date_attribution: attribution ? attribution.date_attribution : null
            };
        });
        
        // Statistiques
        const stats = {
            total: this.radios.length,
            disponible: this.radios.filter(r => r.statut === 'DISPONIBLE').length,
            attribuee: this.radios.filter(r => r.statut === 'ATTRIBUÉE').length,
            hs: this.radios.filter(r => r.statut === 'HS').length,
            reparation: this.radios.filter(r => r.statut === 'RÉPARATION').length
        };
        
        return { radios: radiosAvecAgent, statistiques: stats };
    }

    // =========================================================================
    // GESTION HABILLEMENT
    // =========================================================================

    enregistrerHabillement(codeAgent, habillementData) {
        const habillement = {
            code_agent: codeAgent,
            chemise_taille: habillementData.chemise.taille,
            chemise_date: habillementData.chemise.date,
            jacket_taille: habillementData.jacket.taille,
            jacket_date: habillementData.jacket.date,
            pantalon_taille: habillementData.pantalon.taille,
            pantalon_date: habillementData.pantalon.date,
            cravate_oui: habillementData.cravate.ouiNon,
            cravate_date: habillementData.cravate.date,
            date_mise_a_jour: new Date().toISOString().split('T')[0]
        };
        
        const index = this.habillement.findIndex(h => h.code_agent === codeAgent);
        if (index !== -1) {
            this.habillement[index] = habillement;
        } else {
            this.habillement.push(habillement);
        }
        
        this.saveAllData();
        return habillement;
    }

    obtenirRapportHabillement() {
        return this.habillement.map(h => {
            const agent = this.agents.find(a => a.code === h.code_agent);
            return {
                ...h,
                agent_info: agent ? {
                    nom_complet: `${agent.nom} ${agent.prenom}`,
                    groupe: agent.groupe
                } : null
            };
        });
    }

    // =========================================================================
    // GESTION DES AVERTISSEMENTS
    // =========================================================================

    enregistrerAvertissement(codeAgent, type, description) {
        const avertissement = {
            code_agent: codeAgent,
            type: type.toUpperCase(),
            description: description,
            date: new Date().toISOString().split('T')[0],
            statut: 'ACTIF'
        };
        
        this.avertissements.push(avertissement);
        this.saveAllData();
        return avertissement;
    }

    obtenirAvertissementsAgent(codeAgent) {
        return this.avertissements.filter(a => a.code_agent === codeAgent);
    }

    obtenirRapportAvertissements() {
        const avertissementsAvecAgent = this.avertissements.map(av => {
            const agent = this.agents.find(a => a.code === av.code_agent);
            return {
                ...av,
                agent_info: agent ? {
                    nom_complet: `${agent.nom} ${agent.prenom}`,
                    groupe: agent.groupe
                } : null
            };
        });
        
        const stats = {
            total: this.avertissements.length,
            oral: this.avertissements.filter(a => a.type === 'ORAL').length,
            ecrit: this.avertissements.filter(a => a.type === 'ECRIT').length,
            mise_a_pied: this.avertissements.filter(a => a.type === 'MISE_A_PIED').length
        };
        
        return { avertissements: avertissementsAvecAgent, statistiques: stats };
    }

    // =========================================================================
    // CALCUL DU PLANNING (COMPLET)
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
        
        // Jours du mois
        for (let jour = 1; jour <= joursMois; jour++) {
            const date = new Date(annee, mois - 1, jour);
            const dateStr = `${annee}-${mois.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;
            
            planning.jours.push({
                numero: jour,
                date: dateStr,
                jour_semaine: JOURS_FRANCAIS[date.getDay()],
                ferie: this.estJourFerie(dateStr)
            });
        }
        
        // Shifts par agent
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
    // STATISTIQUES AVANCÉES
    // =========================================================================

    calculerStatistiquesAgent(codeAgent, mois, annee) {
        const joursMois = new Date(annee, mois, 0).getDate();
        const stats = {
            '1': 0, '2': 0, '3': 0, 'R': 0, 
            'C': 0, 'M': 0, 'A': 0, 'F': 0, '-': 0
        };
        
        let feriesTravailles = 0;
        let totalShiftsEffectues = 0;
        
        for (let jour = 1; jour <= joursMois; jour++) {
            const dateStr = `${annee}-${mois.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;
            const shift = this.getShiftEffectif(codeAgent, dateStr);
            
            if (stats[shift] !== undefined) {
                stats[shift] += 1;
                
                if (['1', '2', '3'].includes(shift)) {
                    totalShiftsEffectues += 1;
                    
                    if (this.estJourFerie(dateStr)) {
                        feriesTravailles += 1;
                    }
                }
            }
        }
        
        const agent = this.agents.find(a => a.code === codeAgent);
        let totalOperationnels = 0;
        
        if (agent && agent.groupe === 'E') {
            totalOperationnels = totalShiftsEffectues;
        } else {
            totalOperationnels = totalShiftsEffectues + feriesTravailles;
        }
        
        return {
            stats: stats,
            feries_travailles: feriesTravailles,
            total_shifts: totalShiftsEffectues,
            total_operationnels: totalOperationnels,
            taux_presence: Math.round((totalShiftsEffectues / joursMois) * 100)
        };
    }

    calculerClassementGroupe(groupe, mois, annee) {
        const agentsGroupe = this.agents.filter(a => 
            a.groupe === groupe && a.statut === 'actif'
        );
        
        const classement = agentsGroupe.map(agent => {
            const stats = this.calculerStatistiquesAgent(agent.code, mois, annee);
            return {
                code: agent.code,
                nom_complet: `${agent.nom} ${agent.prenom}`,
                cpa: stats.total_operationnels,
                stats: stats
            };
        });
        
        classement.sort((a, b) => b.cpa - a.cpa);
        
        classement.forEach((agent, index) => {
            agent.rang = index + 1;
        });
        
        return classement;
    }

    calculerJoursTravaillesGroupe(groupe, mois, annee) {
        const agents = this.agents.filter(a => 
            a.groupe === groupe && a.statut === 'actif'
        );
        
        let totalGroupe = 0;
        const resultats = agents.map(agent => {
            const stats = this.calculerStatistiquesAgent(agent.code, mois, annee);
            totalGroupe += stats.total_shifts;
            
            return {
                code: agent.code,
                nom_complet: `${agent.nom} ${agent.prenom}`,
                jours_travailles: stats.total_shifts,
                stats: stats
            };
        });
        
        return {
            groupe: groupe,
            mois: mois,
            annee: annee,
            agents: resultats,
            total_groupe: totalGroupe,
            nombre_agents: agents.length
        };
    }

    // =========================================================================
    // EXPORT DE DONNÉES COMPLET
    // =========================================================================

    exporterExcelComplet() {
        try {
            let csv = "Système de Planning 2026 - Export Complet\n\n";
            
            // 1. Agents
            csv += "=== AGENTS ===\n";
            csv += "Code,Nom,Prénom,Groupe,Date Entrée,Date Sortie,Statut\n";
            this.agents.forEach(agent => {
                csv += `"${agent.code}","${agent.nom}","${agent.prenom}","${agent.groupe}","${agent.date_entree}","${agent.date_sortie || ''}","${agent.statut}"\n`;
            });
            
            // 2. Planning
            csv += "\n=== PLANNING ===\n";
            csv += "Code Agent,Date,Shift\n";
            Object.entries(this.planning).forEach(([key, shift]) => {
                const [code, date] = key.split('_');
                csv += `"${code}","${date}","${shift}"\n`;
            });
            
            // 3. Congés
            csv += "\n=== CONGÉS ===\n";
            csv += "Code Agent,Date Début,Date Fin,Type,Date Création\n";
            this.conges.forEach(conge => {
                csv += `"${conge.code_agent}","${conge.date_debut}","${conge.date_fin}","${conge.type || 'C'}","${conge.date_creation}"\n`;
            });
            
            // 4. Échanges
            csv += "\n=== ÉCHANGES ===\n";
            csv += "Agent 1,Agent 2,Date,Ancien Shift 1,Ancien Shift 2,Nouveau Shift 1,Nouveau Shift 2,Date Échange\n";
            this.historiqueEchanges.forEach(echange => {
                csv += `"${echange.agent1}","${echange.agent2}","${echange.date}","${echange.ancien_shift1}","${echange.ancien_shift2}","${echange.nouveau_shift1}","${echange.nouveau_shift2}","${echange.date_echange}"\n`;
            });
            
            // 5. Codes Panique
            csv += "\n=== CODES PANIQUE ===\n";
            csv += "Code Agent,Code Panique,Poste,Date Création\n";
            this.codesPanique.forEach(cp => {
                csv += `"${cp.code_agent}","${cp.code_panique}","${cp.poste_nom}","${cp.date_creation}"\n`;
            });
            
            // 6. Radios
            csv += "\n=== RADIOS ===\n";
            csv += "ID Radio,Modèle,Statut,Agent Attribué,Date Attribution\n";
            this.radios.forEach(radio => {
                const attribution = this.historiqueRadios.find(hr => 
                    hr.id_radio === radio.id && hr.date_retour === null
                );
                csv += `"${radio.id}","${radio.modele}","${radio.statut}","${attribution?.code_agent || ''}","${attribution?.date_attribution || ''}"\n`;
            });
            
            // 7. Habillement
            csv += "\n=== HABILLEMENT ===\n";
            csv += "Code Agent,Chemise Taille,Chemise Date,Jacket Taille,Jacket Date,Pantalon Taille,Pantalon Date,Cravate,Date Cravate\n";
            this.habillement.forEach(h => {
                csv += `"${h.code_agent}","${h.chemise_taille}","${h.chemise_date}","${h.jacket_taille}","${h.jacket_date}","${h.pantalon_taille}","${h.pantalon_date}","${h.cravate_oui}","${h.cravate_date}"\n`;
            });
            
            // 8. Avertissements
            csv += "\n=== AVERTISSEMENTS ===\n";
            csv += "Code Agent,Type,Description,Date,Statut\n";
            this.avertissements.forEach(av => {
                csv += `"${av.code_agent}","${av.type}","${av.description}","${av.date}","${av.statut}"\n`;
            });
            
            const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `planning_complet_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert(`✅ Export complet réussi !\n📊 ${this.agents.length} agents\n📅 ${Object.keys(this.planning).length} shifts\n📋 ${this.conges.length} congés`);
            
        } catch (error) {
            console.error('Erreur export:', error);
            alert('❌ Erreur lors de l\'export');
        }
    }

    // =========================================================================
    // INTERFACE UTILISATEUR COMPLÈTE
    // =========================================================================

    setupEventListeners() {
        // Navigation par onglets
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.showTab(tabName);
            });
        });
        
        // Événements pour le planning
        document.getElementById('month-select')?.addEventListener('change', () => this.afficherPlanning());
        document.getElementById('year-select')?.addEventListener('change', () => this.afficherPlanning());
        document.getElementById('groupe-select')?.addEventListener('change', () => this.afficherPlanning());
        
        // Initialisation au chargement
        document.addEventListener('DOMContentLoaded', () => {
            this.showTab('dashboard');
            this.afficherDashboard();
            this.afficherPlanning();
            this.initialiserTousLesSelects();
            this.afficherListeConges();
            this.afficherHistoriqueEchanges();
            this.afficherStatutRadios();
            this.afficherCodesPanique();
            this.afficherRapportHabillement();
            this.afficherAvertissements();
        });
    }

    showTab(tabName) {
        // Masquer tous les onglets
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Désactiver tous les boutons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Afficher l'onglet sélectionné
        const tabElement = document.getElementById(`${tabName}-tab`);
        if (tabElement) {
            tabElement.classList.add('active');
        }
        
        // Activer le bouton correspondant
        document.querySelector(`.nav-tab[data-tab="${tabName}"]`)?.classList.add('active');
        
        // Charger le contenu spécifique
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
            case 'add':
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
            case 'export':
                break;
            case 'radios':
                this.afficherStatutRadios();
                break;
            case 'panique':
                this.afficherCodesPanique();
                break;
            case 'habillement':
                this.afficherRapportHabillement();
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

    initialiserTousLesSelects() {
        const selectIds = [
            'absence-agent', 'absence-ponctuelle-agent', 
            'echange-agent1', 'echange-agent2',
            'agent-modifier-select', 'agent-supprimer-select',
            'radio-attribuer-agent', 'radio-retourner-select',
            'panique-agent', 'habillement-agent',
            'avertissement-agent', 'ferie-agent'
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
        
        // Initialiser les select de radios
        const radioSelect = document.getElementById('radio-attribuer-select');
        if (radioSelect) {
            radioSelect.innerHTML = '<option value="">Sélectionner une radio</option>';
            this.radios
                .filter(radio => radio.statut === 'DISPONIBLE')
                .forEach(radio => {
                    const option = document.createElement('option');
                    option.value = radio.id;
                    option.textContent = `${radio.id} - ${radio.modele}`;
                    radioSelect.appendChild(option);
                });
        }
    }

    // =========================================================================
    // MÉTHODES D'AFFICHAGE POUR CHAQUE ONGLET
    // =========================================================================

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
        
        const radiosStats = this.obtenirStatutRadios().statistiques;
        
        document.getElementById('total-agents').textContent = agentsActifs.length;
        document.getElementById('present-today').textContent = presentsAujourdhui;
        document.getElementById('total-groupes').textContent = [...new Set(agentsActifs.map(a => a.groupe))].length;
        document.getElementById('en-service').textContent = agentsActifs.length;
        
        // Afficher les stats des radios
        const radiosDiv = document.getElementById('radios-stats');
        if (radiosDiv) {
            radiosDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px; border-radius: 10px;">
                    <div style="font-size: 14px; opacity: 0.9;">📻 Radios</div>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                        <div>
                            <div style="font-size: 12px;">Disponibles</div>
                            <div style="font-size: 24px; font-weight: bold;">${radiosStats.disponible}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px;">Attribuées</div>
                            <div style="font-size: 24px; font-weight: bold;">${radiosStats.attribuee}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px;">HS/Réparation</div>
                            <div style="font-size: 24px; font-weight: bold;">${radiosStats.hs + radiosStats.reparation}</div>
                        </div>
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
            const estFerie = jour.ferie;
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
                const estFerie = jourInfo.ferie;
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
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: grid; gap: 12px;">';
        
        agentsActifs.forEach(agent => {
            const groupeColor = this.getGroupeColor(agent.groupe);
            const stats = this.calculerStatistiquesAgent(agent.code, new Date().getMonth() + 1, 2026);
            
            html += `
                <div style="background: white; border-radius: 12px; padding: 16px; border: 2px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div>
                            <strong style="font-size: 16px;">${agent.code}</strong>
                            <span style="background: ${groupeColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 10px;">
                                Groupe ${agent.groupe}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #10b981; font-weight: bold;">
                            CPA: ${stats.total_operationnels}
                        </div>
                    </div>
                    <div style="font-size: 14px; color: #1e293b;">
                        ${agent.nom} ${agent.prenom}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                        Entré le: ${agent.date_entree}
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="app.afficherDetailsAgent('${agent.code}')" 
                                style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px;">
                            📊 Statistiques
                        </button>
                        <button onclick="app.supprimerAgentUI('${agent.code}')" 
                                style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 12px;">
                            🗑️ Supprimer
                        </button>
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
        
        const { radios, statistiques } = this.obtenirStatutRadios();
        
        let html = `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <div style="flex: 1; background: #10b981; color: white; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px;">Disponibles</div>
                        <div style="font-size: 24px; font-weight: bold;">${statistiques.disponible}</div>
                    </div>
                    <div style="flex: 1; background: #3b82f6; color: white; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px;">Attribuées</div>
                        <div style="font-size: 24px; font-weight: bold;">${statistiques.attribuee}</div>
                    </div>
                    <div style="flex: 1; background: #ef4444; color: white; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px;">HS/Réparation</div>
                        <div style="font-size: 24px; font-weight: bold;">${statistiques.hs + statistiques.reparation}</div>
                    </div>
                </div>
            </div>
            <div style="display: grid; gap: 10px;">
        `;
        
        radios.forEach(radio => {
            let statutColor = '#10b981'; // Disponible
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
                    ${radio.agent ? `
                        <div style="font-size: 12px; color: #64748b;">
                            Attribuée à: ${radio.agent}
                            ${radio.date_attribution ? `<br><small>Depuis: ${radio.date_attribution}</small>` : ''}
                        </div>
                        <button onclick="app.retournerRadioUI('${radio.id}')" 
                                style="margin-top: 8px; padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 11px;">
                            🔄 Retourner
                        </button>
                    ` : `
                        <select id="agent-radio-${radio.id}" style="margin-top: 8px; padding: 4px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px;">
                            <option value="">Attribuer à...</option>
                            ${this.agents.filter(a => a.statut === 'actif').map(agent => 
                                `<option value="${agent.code}">${agent.code} - ${agent.nom} ${agent.prenom}</option>`
                            ).join('')}
                        </select>
                        <button onclick="app.attribuerRadioUI('${radio.id}')" 
                                style="margin-top: 8px; padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 11px;">
                            ✅ Attribuer
                        </button>
                    `}
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    afficherCodesPanique() {
        const container = document.getElementById('panique-list');
        if (!container) return;
        
        const codes = this.obtenirCodesPanique();
        
        if (codes.length === 0) {
            container.innerHTML = '<p style="color: #64748b; text-align: center;">Aucun code panique enregistré</p>';
            return;
        }
        
        let html = '<div style="display: grid; gap: 10px;">';
        
        codes.forEach(code => {
            html += `
                <div style="background: white; border-left: 4px solid #ef4444; padding: 12px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <div>
                            <strong>${code.code_agent}</strong>
                            <span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-left: 8px;">
                                CODE PANIQUE
                            </span>
                        </div>
                        <button onclick="app.supprimerCodePaniqueUI('${code.code_agent}')" 
                                style="padding: 4px 8px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; font-size: 11px;">
                            Supprimer
                        </button>
                    </div>
                    <div style="font-size: 13px; color: #64748b;">
                        Code: <strong style="color: #1e293b;">${code.code_panique}</strong>
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                        Poste: ${code.poste_nom} | Agent: ${code.nom_complet}
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
        
        const { avertissements, statistiques } = this.obtenirRapportAvertissements();
        
        let html = `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <div style="flex: 1; background: #f59e0b; color: white; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px;">Orals</div>
                        <div style="font-size: 24px; font-weight: bold;">${statistiques.oral}</div>
                    </div>
                    <div style="flex: 1; background: #ef4444; color: white; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px;">Écrits</div>
                        <div style="font-size: 24px; font-weight: bold;">${statistiques.ecrit}</div>
                    </div>
                    <div style="flex: 1; background: #dc2626; color: white; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px;">Mise à pied</div>
                        <div style="font-size: 24px; font-weight: bold;">${statistiques.mise_a_pied}</div>
                    </div>
                </div>
            </div>
        `;
        
        if (avertissements.length === 0) {
            html += '<p style="color: #64748b; text-align: center;">Aucun avertissement enregistré</p>';
        } else {
            html += '<div style="display: grid; gap: 10px;">';
            
            avertissements.forEach(av => {
                let typeColor = '#f59e0b';
                if (av.type === 'ECRIT') typeColor = '#ef4444';
                if (av.type === 'MISE_A_PIED') typeColor = '#dc2626';
                
                html += `
                    <div style="background: white; border-left: 4px solid ${typeColor}; padding: 12px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <div>
                                <strong>${av.agent_info?.nom_complet || av.code_agent}</strong>
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
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                            Groupe: ${av.agent_info?.groupe || 'N/A'}
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        container.innerHTML = html;
    }

    afficherClassement() {
        const container = document.getElementById('classement-result');
        if (!container) return;
        
        const mois = new Date().getMonth() + 1;
        const annee = new Date().getFullYear();
        
        let html = '<div style="display: grid; gap: 15px;">';
        
        ['A', 'B', 'C', 'D', 'E'].forEach(groupe => {
            const classement = this.calculerClassementGroupe(groupe, mois, annee);
            
            if (classement.length > 0) {
                html += `
                    <div style="background: white; border-radius: 12px; padding: 15px;">
                        <h4 style="margin-bottom: 15px; color: ${this.getGroupeColor(groupe)};">🏆 Classement Groupe ${groupe}</h4>
                        <div style="display: grid; gap: 8px;">
                `;
                
                classement.forEach((agent, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    
                    html += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: ${index < 3 ? '#f0f9ff' : '#f8fafc'}; border-radius: 8px;">
                            <div>
                                <span style="font-size: 16px; margin-right: 10px;">${medal}</span>
                                <strong>${agent.code}</strong>
                                <span style="font-size: 12px; color: #64748b; margin-left: 10px;">${agent.nom_complet}</span>
                            </div>
                            <div style="font-size: 18px; font-weight: bold; color: #059669;">
                                ${agent.cpa} CPA
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    // =========================================================================
    // MÉTHODES D'INTERFACE UTILISATEUR
    // =========================================================================

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

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('✅ Service Worker enregistré'))
                .catch(err => console.error('❌ Erreur Service Worker:', err));
        }
    }

    // =========================================================================
    // MÉTHODES UI POUR LES FORMULAIRES
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
        this.afficherListeConges();
        
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
        this.afficherListeConges();
        
        document.getElementById('absence-ponctuelle-agent').value = '';
        document.getElementById('absence-date').value = '';
        document.getElementById('type-absence').value = '';
        
        alert(`✅ Absence ${typeAbsence} enregistrée pour ${codeAgent} le ${dateAbsence}`);
    }

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
        
        const result = this.echangerShifts(agent1, agent2, dateEchange);
        
        if (result.succes) {
            alert(result.message);
            this.afficherHistoriqueEchanges();
            
            document.getElementById('echange-agent1').value = '';
            document.getElementById('echange-agent2').value = '';
            document.getElementById('echange-date').value = '';
            document.getElementById('apercu-echange').style.display = 'none';
        } else {
            alert(`❌ ${result.erreur}`);
        }
    }

    ajouterCodePaniqueViaFormulaire() {
        const codeAgent = document.getElementById('panique-agent').value;
        const codePanique = document.getElementById('code-panique').value;
        const poste = document.getElementById('poste-panique').value;
        
        if (!codeAgent || !codePanique || !poste) {
            alert('Tous les champs sont obligatoires');
            return;
        }
        
        this.ajouterCodePanique(codeAgent, codePanique, poste);
        this.afficherCodesPanique();
        
        document.getElementById('panique-agent').value = '';
        document.getElementById('code-panique').value = '';
        document.getElementById('poste-panique').value = '';
        
        alert(`✅ Code panique ${codePanique} enregistré pour ${codeAgent}`);
    }

    attribuerRadioUI(radioId) {
        const agentSelect = document.getElementById(`agent-radio-${radioId}`);
        const codeAgent = agentSelect?.value;
        
        if (!codeAgent) {
            alert('Veuillez sélectionner un agent');
            return;
        }
        
        const result = this.attribuerRadio(radioId, codeAgent);
        if (result.succes) {
            alert(result.message);
            this.afficherStatutRadios();
        } else {
            alert(`❌ ${result.erreur}`);
        }
    }

    retournerRadioUI(radioId) {
        if (!confirm(`Retourner la radio ${radioId} ?`)) return;
        
        const result = this.retournerRadio(radioId);
        if (result.succes) {
            alert(result.message);
            this.afficherStatutRadios();
        } else {
            alert(`❌ ${result.erreur}`);
        }
    }

    ajouterAvertissementViaFormulaire() {
        const codeAgent = document.getElementById('avertissement-agent').value;
        const type = document.getElementById('type-avertissement').value;
        const description = document.getElementById('description-avertissement').value;
        
        if (!codeAgent || !type || !description) {
            alert('Tous les champs sont obligatoires');
            return;
        }
        
        this.enregistrerAvertissement(codeAgent, type, description);
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
        
        this.ajouterJourFerie(date, description);
        this.afficherJoursFeries();
        
        document.getElementById('ferie-date').value = '';
        document.getElementById('ferie-description').value = '';
        
        alert(`✅ Jour férié ajouté : ${description} le ${date}`);
    }

    supprimerAgentUI(codeAgent) {
        if (!confirm(`Supprimer l'agent ${codeAgent} ? Il sera marqué comme inactif.`)) return;
        
        const result = this.supprimerAgent(codeAgent);
        if (result.succes) {
            alert(result.message);
            this.afficherListeAgents();
        } else {
            alert(`❌ ${result.erreur}`);
        }
    }

    supprimerCodePaniqueUI(codeAgent) {
        if (!confirm(`Supprimer le code panique de ${codeAgent} ?`)) return;
        
        this.supprimerCodePanique(codeAgent);
        this.afficherCodesPanique();
        alert(`✅ Code panique supprimé pour ${codeAgent}`);
    }

    // Ajoutez d'autres méthodes UI au besoin...
}

// =========================================================================
// INITIALISATION DE L'APPLICATION
// =========================================================================

window.app = new PlanningMetierComplet();

// Fonctions globales pour HTML
window.showTab = (tabName) => window.app.showTab(tabName);
window.addAgent = () => window.app.ajouterAgentViaFormulaire();
window.ajouterCongePeriode = () => window.app.ajouterCongeViaFormulaire();
window.ajouterAbsencePonctuelle = () => window.app.ajouterAbsenceViaFormulaire();
window.previsualiserEchange = () => window.app.previsualiserEchange();
window.validerEchange = () => window.app.validerEchange();
window.ajouterCodePanique = () => window.app.ajouterCodePaniqueViaFormulaire();
window.attribuerRadioUI = (radioId) => window.app.attribuerRadioUI(radioId);
window.retournerRadioUI = (radioId) => window.app.retournerRadioUI(radioId);
window.ajouterAvertissement = () => window.app.ajouterAvertissementViaFormulaire();
window.ajouterJourFerie = () => window.app.ajouterJourFerieViaFormulaire();
window.supprimerAgentUI = (code) => window.app.supprimerAgentUI(code);
window.supprimerCodePaniqueUI = (code) => window.app.supprimerCodePaniqueUI(code);

window.supprimerConge = (code, debut, fin) => {
    if (confirm(`Supprimer ce congé ?`)) {
        window.app.supprimerCongePeriode(code, debut, fin);
        window.app.afficherListeConges();
    }
};

window.exporterExcelComplet = () => window.app.exporterExcelComplet();
window.exporterPlanningMensuel = () => window.app.exporterPlanningMensuel();
window.exporterStatistiques = () => window.app.exporterStatistiques();
window.exporterBackupJSON = () => window.app.exporterBackupJSON();
window.importerBackupJSON = () => window.app.importerBackupJSON();

document.addEventListener('DOMContentLoaded', () => {
    window.app.showTab('dashboard');
    window.app.afficherDashboard();
});
