/**
 * Mock Services Layer for Localyze
 * This allows the app to function with full persistence without Firebase keys.
 */

// --- UTILS ---
const isBrowser = typeof window !== 'undefined';
const storage = {
  get: (key: string) => isBrowser ? JSON.parse(localStorage.getItem(`localyze_${key}`) || 'null') : null,
  set: (key: string, val: any) => isBrowser && localStorage.setItem(`localyze_${key}`, JSON.stringify(val)),
};

// --- MOCK AUTH ---
class MockAuth {
  private user: any = storage.get('current_user');
  private listeners: Function[] = [];

  get currentUser() { return this.user; }

  onAuthStateChanged(callback: Function) {
    this.listeners.push(callback);
    callback(this.user);
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  }

  async createUserWithEmailAndPassword(_auth: any, email: string, _pass: string) {
    const newUser = { uid: `u_${Date.now()}`, email, emailVerified: true, providerData: [] };
    this.user = newUser;
    storage.set('current_user', newUser);
    // Initialize user in mock firestore as well
    const users = storage.get('db_users') || {};
    users[newUser.uid] = { id: newUser.uid, email, name: email.split('@')[0], totalRequests: 0, trustScore: 50, earnings: 0, createdAt: new Date().toISOString() };
    storage.set('db_users', users);
    
    this.notify();
    return { user: newUser };
  }

  async signInWithEmailAndPassword(_auth: any, email: string, _pass: string) {
    const users = storage.get('db_users') || {};
    const existingUser = Object.values(users).find((u: any) => u.email === email) as any;
    
    if (!existingUser) throw new Error('User not found in simulation database.');
    
    this.user = { uid: existingUser.id, email: existingUser.email, emailVerified: true };
    storage.set('current_user', this.user);
    this.notify();
    return { user: this.user };
  }

  async signInWithPopup(_auth: any, _provider: any) {
    throw new Error('Google Sign-In is not supported in simulation mode. Please use Email/Password.');
  }

  async signOut() {
    this.user = null;
    storage.set('current_user', null);
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.user));
  }
}

// --- MOCK FIRESTORE ---
class MockFirestore {
  private collections: any = {
    users: storage.get('db_users') || {},
    requests: storage.get('db_requests') || {},
    payments: storage.get('db_payments') || {},
    validations: storage.get('db_validations') || {},
    earnings: storage.get('db_earnings') || {}
  };

  private listeners: Record<string, Function[]> = {};

  doc(dbOrCol: any, colOrId?: string, id?: string) {
    let col = typeof dbOrCol === 'string' ? dbOrCol : colOrId!;
    let maybeId = typeof dbOrCol === 'string' ? colOrId : id;
    let docId = maybeId || `id_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
    return { 
      path: `${col}/${docId}`, 
      collection: col, 
      id: docId,
      set: (data: any) => this.setDoc({collection: col, id: docId}, data),
      get: () => this.getDoc({collection: col, id: docId}),
      update: (data: any) => this.updateDoc({collection: col, id: docId}, data)
    };
  }

  collection(dbOrName: any, name?: string) {
    let colName = typeof dbOrName === 'string' ? dbOrName : name!;
    return {
      collection: colName,
      doc: (id?: string) => this.doc(colName, id || `id_${Date.now()}`),
      where: (field: string, op: string, val: any) => ({
         get: async () => {
            const list = Object.values(this.collections[colName] || {});
            const filtered = list.filter((item: any) => {
               if (op === '==') return item[field] === val;
               return true;
            });
            return { docs: filtered.map(d => ({ data: () => d, exists: true })) };
         }
      })
    };
  }

  async runTransaction(callback: any) {
    const tx = {
      get: async (ref: any) => ref.get(),
      set: (ref: any, data: any) => ref.set(data),
      update: (ref: any, data: any) => ref.update(data)
    };
    return await callback(tx);
  }

  async getDoc(docRef: any) {
    const data = this.collections[docRef.collection]?.[docRef.id];
    return { exists: !!data, data: () => data };
  }

  async setDoc(docRef: any, data: any) {
    if (!this.collections[docRef.collection]) this.collections[docRef.collection] = {};
    this.collections[docRef.collection][docRef.id] = { ...this.collections[docRef.collection][docRef.id], ...data };
    this.persist(docRef.collection);
    this.notify(docRef.path);
  }

  async updateDoc(docRef: any, data: any) {
    return this.setDoc(docRef, data);
  }

  onSnapshot(ref: any, callback: Function) {
    const path = ref.path || ref.collection;
    if (!this.listeners[path]) this.listeners[path] = [];
    this.listeners[path].push(callback);
    
    // Initial data
    if (ref.path) {
      const data = this.collections[ref.collection]?.[ref.id];
      callback({ exists: () => !!data, data: () => data });
    } else {
      const list = Object.values(this.collections[ref.collection] || {});
      callback({ forEach: (cb: any) => list.forEach(item => cb({ id: (item as any).id, data: () => item })) });
    }

    return () => { this.listeners[path] = this.listeners[path].filter(l => l !== callback); };
  }

  private persist(col: string) {
    storage.set(`db_${col}`, this.collections[col]);
  }

  private notify(path: string) {
     const [col, id] = path.split('/');
     
     // Notify document-specific listeners
     if (this.listeners[path]) {
        const data = this.collections[col]?.[id];
        this.listeners[path].forEach(l => l({ exists: () => !!data, data: () => data }));
     }

     // Notify collection-wide listeners
     if (this.listeners[col]) {
        const list = Object.values(this.collections[col] || {});
        this.listeners[col].forEach(l => l({ 
          forEach: (cb: any) => list.forEach(item => cb({ id: (item as any).id, data: () => item })) 
        }));
     }
  }
}

export const mockAuth = new MockAuth();
export const mockDb = new MockFirestore();
export const mockGoogleProvider = {};
