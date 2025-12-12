// ============================================
// DANEDUC FIREBASE SIMULATOR - VERSION PROFESSIONNELLE
// ============================================

class FirebaseSimulator {
    constructor() {
        this.users = this.loadFromStorage('daneduc_users') || [];
        this.courses = this.loadFromStorage('daneduc_courses') || this.getDefaultCourses();
        this.currentUser = this.loadFromStorage('daneduc_currentUser') || null;
        this.isAuthenticated = !!this.currentUser;
        
        console.log('🔥 Firebase Simulator initialisé');
        console.log(`👥 ${this.users.length} utilisateurs`);
        console.log(`📚 ${this.courses.length} fiches`);
    }

    // ==================== AUTHENTICATION ====================
    
    async createUserWithEmailAndPassword(email, password, userData = {}) {
        return new Promise((resolve, reject) => {
            // Validation
            if (!email || !password) {
                reject(new Error('Email et mot de passe requis'));
                return;
            }

            if (password.length < 6) {
                reject(new Error('Le mot de passe doit contenir au moins 6 caractères'));
                return;
            }

            // Vérifier si l'utilisateur existe déjà
            if (this.users.find(u => u.email === email)) {
                reject(new Error('Un compte existe déjà avec cet email'));
                return;
            }

            // Créer l'utilisateur
            const newUser = {
                id: this.generateId(),
                email: email,
                password: this.hashPassword(password), // Simulation de hash
                name: userData.name || email.split('@')[0],
                level: userData.level || 'terminale',
                createdAt: new Date().toISOString(),
                favorites: [],
                downloads: []
            };

            // Ajouter à la base
            this.users.push(newUser);
            this.saveToStorage('daneduc_users', this.users);

            // Connecter automatiquement
            this.currentUser = { ...newUser };
            delete this.currentUser.password; // Ne pas stocker le mot de passe en clair
            this.isAuthenticated = true;
            this.saveToStorage('daneduc_currentUser', this.currentUser);

            console.log(`✅ Nouvel utilisateur créé: ${email}`);
            resolve({
                user: this.currentUser,
                operationType: 'signIn'
            });
        });
    }

    async signInWithEmailAndPassword(email, password) {
        return new Promise((resolve, reject) => {
            // Trouver l'utilisateur
            const user = this.users.find(u => u.email === email);
            
            if (!user) {
                reject(new Error('Aucun compte trouvé avec cet email'));
                return;
            }

            // Vérifier le mot de passe (simulé)
            if (this.hashPassword(password) !== user.password) {
                reject(new Error('Mot de passe incorrect'));
                return;
            }

            // Connecter l'utilisateur
            this.currentUser = { ...user };
            delete this.currentUser.password;
            this.isAuthenticated = true;
            this.saveToStorage('daneduc_currentUser', this.currentUser);

            console.log(`✅ Utilisateur connecté: ${email}`);
            resolve({
                user: this.currentUser,
                operationType: 'signIn'
            });
        });
    }

    async signOut() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.saveToStorage('daneduc_currentUser', null);
        console.log('✅ Utilisateur déconnecté');
        return Promise.resolve();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    onAuthStateChanged(callback) {
        // Simuler l'écoute des changements d'authentification
        const checkAuth = () => {
            const user = this.getCurrentUser();
            callback(user);
        };
        
        // Vérifier immédiatement
        setTimeout(() => checkAuth(), 100);
        
        // Retourner une fonction pour se désabonner
        return () => console.log('Observer désabonné');
    }

    // ==================== FIRESTORE SIMULATION ====================

    async getCourses(filters = {}) {
        return new Promise((resolve) => {
            let filteredCourses = [...this.courses];

            // Appliquer les filtres
            if (filters.level && filters.level !== 'all') {
                filteredCourses = filteredCourses.filter(c => 
                    c.level.toLowerCase().includes(filters.level.toLowerCase())
                );
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredCourses = filteredCourses.filter(c =>
                    c.title.toLowerCase().includes(searchTerm) ||
                    c.description.toLowerCase().includes(searchTerm) ||
                    c.tags.some(tag => tag.toLowerCase().includes(searchTerm))
                );
            }

            // Limiter le nombre de résultats
            if (filters.limit) {
                filteredCourses = filteredCourses.slice(0, filters.limit);
            }

            console.log(`📚 Retourne ${filteredCourses.length} fiches`);
            resolve(filteredCourses);
        });
    }

    async getCourseById(courseId) {
        return new Promise((resolve, reject) => {
            const course = this.courses.find(c => c.id === courseId);
            if (course) {
                // Simuler l'incrémentation des téléchargements
                this.incrementDownloadCount(courseId);
                resolve(course);
            } else {
                reject(new Error('Fiche non trouvée'));
            }
        });
    }

    async addToFavorites(courseId) {
        if (!this.currentUser) {
            throw new Error('Vous devez être connecté');
        }

        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex === -1) return;

        // Ajouter aux favoris si pas déjà présent
        if (!this.users[userIndex].favorites.includes(courseId)) {
            this.users[userIndex].favorites.push(courseId);
            this.currentUser.favorites = [...this.users[userIndex].favorites];
            this.saveToStorage('daneduc_users', this.users);
            this.saveToStorage('daneduc_currentUser', this.currentUser);
        }

        return Promise.resolve();
    }

    async removeFromFavorites(courseId) {
        if (!this.currentUser) {
            throw new Error('Vous devez être connecté');
        }

        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex === -1) return;

        // Retirer des favoris
        this.users[userIndex].favorites = this.users[userIndex].favorites.filter(id => id !== courseId);
        this.currentUser.favorites = [...this.users[userIndex].favorites];
        this.saveToStorage('daneduc_users', this.users);
        this.saveToStorage('daneduc_currentUser', this.currentUser);

        return Promise.resolve();
    }

    // ==================== STORAGE SIMULATION ====================

    async downloadPDF(courseId) {
        return new Promise((resolve) => {
            // Simuler un téléchargement
            if (this.currentUser) {
                const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
                if (userIndex !== -1) {
                    if (!this.users[userIndex].downloads.includes(courseId)) {
                        this.users[userIndex].downloads.push(courseId);
                        this.saveToStorage('daneduc_users', this.users);
                    }
                }
            }

            // Incrémenter le compteur de téléchargements
            this.incrementDownloadCount(courseId);

            // Simuler un délai de téléchargement
            setTimeout(() => {
                console.log(`📥 PDF téléchargé: ${courseId}`);
                resolve({
                    success: true,
                    url: `assets/pdfs/${courseId}.pdf` // Chemin simulé
                });
            }, 800);
        });
    }

    // ==================== UTILS ====================

    incrementDownloadCount(courseId) {
        const courseIndex = this.courses.findIndex(c => c.id === courseId);
        if (courseIndex !== -1) {
            this.courses[courseIndex].downloads++;
            this.saveToStorage('daneduc_courses', this.courses);
        }
    }

    getDefaultCourses() {
        return [
            {
                id: 'maths_terminale_suites',
                title: 'Suites Numériques - Terminale C',
                description: 'Comprendre les suites arithmétiques et géométriques avec exercices corrigés conformes au programme camerounais.',
                level: 'Terminale',
                field: 'Scientifique',
                subject: 'Mathématiques',
                pages: 15,
                downloads: 1250,
                rating: 4.8,
                tags: ['suites', 'arithmétique', 'géométrique', 'limites'],
                author: {
                    name: 'Dr. Jean Kamga',
                    title: 'Professeur de Mathématiques',
                    avatar: 'JK'
                },
                duration: '2h30',
                difficulty: 'Intermédiaire',
                publishedDate: '2023-10-15',
                thumbnail: '📐'
            },
            {
                id: 'compta_bts_gestion',
                title: 'Comptabilité Générale - BTS Gestion',
                description: 'Principes fondamentaux de la comptabilité avec études de cas pratiques adaptées au contexte camerounais.',
                level: 'BTS',
                field: 'Gestion',
                subject: 'Comptabilité',
                pages: 22,
                downloads: 845,
                rating: 4.5,
                tags: ['comptabilité', 'bilan', 'journal', 'grand livre'],
                author: {
                    name: 'Marie Atangana',
                    title: 'Expert-Comptable',
                    avatar: 'MA'
                },
                duration: '3h',
                difficulty: 'Débutant',
                publishedDate: '2023-09-20',
                thumbnail: '📊'
            },
            {
                id: 'droit_civil_licence',
                title: 'Introduction au Droit Civil',
                description: 'Notions fondamentales sur les personnes, la famille et les biens dans le système juridique camerounais.',
                level: 'Licence',
                field: 'Droit',
                subject: 'Droit Civil',
                pages: 28,
                downloads: 1500,
                rating: 4.9,
                tags: ['droit civil', 'personnes', 'famille', 'biens'],
                author: {
                    name: 'Maître Kevin Ngo',
                    title: 'Avocat à la Cour',
                    avatar: 'KN'
                },
                duration: '4h',
                difficulty: 'Avancé',
                publishedDate: '2023-11-05',
                thumbnail: '⚖️'
            },
            {
                id: 'physique_mecanique',
                title: 'Mécanique Newtonienne',
                description: 'Les lois de Newton et leurs applications avec exercices pratiques pour la préparation au Bac.',
                level: 'Terminale',
                field: 'Scientifique',
                subject: 'Physique',
                pages: 18,
                downloads: 980,
                rating: 4.7,
                tags: ['mécanique', 'newton', 'forces', 'mouvement'],
                author: {
                    name: 'Dr. Paul Dikongué',
                    title: 'Physicien',
                    avatar: 'PD'
                },
                duration: '2h45',
                difficulty: 'Intermédiaire',
                publishedDate: '2023-10-30',
                thumbnail: '⚛️'
            },
            {
                id: 'marketing_digital',
                title: 'Marketing Digital pour Entrepreneurs',
                description: 'Stratégies digitales adaptées au marché camerounais : réseaux sociaux, SEO, email marketing.',
                level: 'BTS',
                field: 'Commerce',
                subject: 'Marketing',
                pages: 20,
                downloads: 1120,
                rating: 4.6,
                tags: ['marketing', 'digital', 'réseaux sociaux', 'entrepreneuriat'],
                author: {
                    name: 'Sarah Ambassa',
                    title: 'Consultante en Marketing Digital',
                    avatar: 'SA'
                },
                duration: '3h15',
                difficulty: 'Débutant',
                publishedDate: '2023-11-10',
                thumbnail: '📱'
            },
            {
                id: 'biologie_cellulaire',
                title: 'Biologie Cellulaire - Licence 1',
                description: 'Structure et fonctions des cellules eucaryotes avec schémas détaillés et QCM d\'auto-évaluation.',
                level: 'Licence',
                field: 'Sciences',
                subject: 'Biologie',
                pages: 25,
                downloads: 760,
                rating: 4.8,
                tags: ['biologie', 'cellule', 'membrane', 'organites'],
                author: {
                    name: 'Dr. Françoise Mbappé',
                    title: 'Biologiste Moléculaire',
                    avatar: 'FM'
                },
                duration: '3h30',
                difficulty: 'Avancé',
                publishedDate: '2023-09-15',
                thumbnail: '🔬'
            }
        ];
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    hashPassword(password) {
        // Simulation simple de hash (NE PAS UTILISER EN PRODUCTION)
        return btoa(password + 'daneduc_salt');
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erreur de chargement:', error);
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
            return false;
        }
    }

    // ==================== ADMIN METHODS ====================

    resetDatabase() {
        localStorage.clear();
        this.users = [];
        this.courses = this.getDefaultCourses();
        this.currentUser = null;
        this.isAuthenticated = false;
        console.log('🗑️ Base de données réinitialisée');
    }

    exportData() {
        return {
            users: this.users,
            courses: this.courses,
            currentUser: this.currentUser
        };
    }

    importData(data) {
        if (data.users) this.users = data.users;
        if (data.courses) this.courses = data.courses;
        if (data.currentUser) this.currentUser = data.currentUser;
        
        this.saveToStorage('daneduc_users', this.users);
        this.saveToStorage('daneduc_courses', this.courses);
        this.saveToStorage('daneduc_currentUser', this.currentUser);
        
        console.log('📥 Données importées avec succès');
    }
}

// ============================================
// INITIALISATION ET EXPORT
// ============================================

// Créer une instance globale
window.firebaseSimulator = new FirebaseSimulator();

// Simuler l'objet firebase pour compatibilité
window.firebase = {
    auth: () => ({
        createUserWithEmailAndPassword: (email, password) => 
            firebaseSimulator.createUserWithEmailAndPassword(email, password),
        signInWithEmailAndPassword: (email, password) => 
            firebaseSimulator.signInWithEmailAndPassword(email, password),
        signOut: () => firebaseSimulator.signOut(),
        currentUser: firebaseSimulator.getCurrentUser(),
        onAuthStateChanged: (callback) => 
            firebaseSimulator.onAuthStateChanged(callback)
    }),
    
    firestore: () => ({
        collection: (name) => ({
            get: async () => {
                const data = await firebaseSimulator.getCourses();
                return {
                    docs: data.map(item => ({
                        id: item.id,
                        data: () => item
                    }))
                };
            },
            doc: (id) => ({
                get: async () => {
                    const data = await firebaseSimulator.getCourseById(id);
                    return {
                        exists: !!data,
                        data: () => data
                    };
                }
            })
        })
    }),

    // Méthodes utilitaires
    simulator: firebaseSimulator
};

console.log('🚀 Firebase Simulator prêt !');
console.log('📖 Documentation:');
console.log('1. firebase.auth().createUserWithEmailAndPassword(email, pass)');
console.log('2. firebase.auth().signInWithEmailAndPassword(email, pass)');
console.log('3. firebase.auth().signOut()');
console.log('4. firebase.firestore().collection("courses").get()');
console.log('5. firebase.simulator.downloadPDF(courseId)');