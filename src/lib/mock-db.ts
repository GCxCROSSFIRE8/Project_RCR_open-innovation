/**
 * A simple in-memory database to allow "Smooth Simulation" 
 * when Firebase Admin keys are missing.
 */

class MockDB {
  private static instance: MockDB;
  private storage: Record<string, Record<string, any>> = {
    payments: {},
    requests: {},
    users: {
      'test_validator_1': { id: 'test_validator_1', role: 'validator', balance: 0 }
    },
    earnings: {},
    validations: {}
  };

  public static getInstance(): MockDB {
    if (!MockDB.instance) {
      MockDB.instance = new MockDB();
    }
    return MockDB.instance;
  }

  // Mimics Firestore collection().doc().set() / update()
  collection(name: string) {
    const self = this;
    return {
      doc(id?: string) {
        const docId = id || Math.random().toString(36).substring(7);
        return {
          id: docId,
          async get() {
            const data = self.storage[name]?.[docId];
            return {
              exists: !!data,
              data: () => data
            };
          },
          async set(data: any, options?: { merge: boolean }) {
            if (!self.storage[name]) self.storage[name] = {};
            if (options?.merge) {
              self.storage[name][docId] = { ...self.storage[name][docId], ...data };
            } else {
              self.storage[name][docId] = data;
            }
          },
          async update(data: any) {
            if (!self.storage[name]) self.storage[name] = {};
            self.storage[name][docId] = { ...self.storage[name][docId], ...data };
          }
        };
      },
      // Basic query mocking for the validator list
      where(field: string, op: string, value: any) {
        return {
          async get() {
            const results = Object.values(self.storage[name] || {})
              .filter(item => item[field] === value);
            return {
              forEach: (callback: any) => results.forEach(item => callback({ data: () => item, id: item.id }))
            };
          }
        };
      }
    };
  }

  // Mimics runTransaction
  async runTransaction(callback: any) {
    // Simple mock: execute immediately without concurrency care for simulation
    const transaction = {
      get: async (ref: any) => ref.get(),
      set: (ref: any, data: any, options?: any) => ref.set(data, options),
      update: (ref: any, data: any) => ref.update(data)
    };
    return await callback(transaction);
  }
}

export const mockDb = MockDB.getInstance();
