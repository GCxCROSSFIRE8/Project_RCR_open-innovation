/**
 * In-memory Mock DB for simulation mode.
 * Uses globalThis to ensure the SAME instance is shared across
 * all Next.js API routes (Turbopack creates separate module contexts).
 */

const GLOBAL_KEY = '__LOCALYZE_MOCK_DB__';

class MockDB {
  private storage: Record<string, Record<string, any>> = {
    payments: {},
    requests: {},
    users: {
      'mock_user_001': { id: 'mock_user_001', name: 'Demo User', email: 'demo@localyze.ai', role: 'seeker', trustScore: 85, totalRequests: 5, totalValidations: 2, earnings: 120 },
      'test_validator_1': { id: 'test_validator_1', role: 'validator', balance: 0 },
    },
    earnings: {},
    validations: {},
  };

  collection(name: string) {
    const self = this;
    return {
      doc(id?: string) {
        const docId = id || 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        return {
          id: docId,
          async get() {
            const data = self.storage[name]?.[docId];
            return { exists: !!data, data: () => data };
          },
          async set(data: any, options?: { merge: boolean }) {
            if (!self.storage[name]) self.storage[name] = {};
            if (options?.merge) {
              self.storage[name][docId] = { ...self.storage[name][docId], ...data };
            } else {
              self.storage[name][docId] = data;
            }
            console.log(`[MockDB] SET ${name}/${docId}`);
          },
          async update(data: any) {
            if (!self.storage[name]) self.storage[name] = {};
            self.storage[name][docId] = { ...self.storage[name][docId], ...data };
            console.log(`[MockDB] UPDATE ${name}/${docId}`);
          },
        };
      },
      where(field: string, _op: string, value: any) {
        return {
          async get() {
            const results = Object.values(self.storage[name] || {}).filter(
              (item) => item[field] === value
            );
            return {
              forEach: (cb: any) =>
                results.forEach((item) => cb({ data: () => item, id: item.id })),
            };
          },
        };
      },
    };
  }

  async runTransaction(callback: any) {
    const transaction = {
      get: async (ref: any) => ref.get(),
      set: (ref: any, data: any, options?: any) => ref.set(data, options),
      update: (ref: any, data: any) => ref.update(data),
    };
    return await callback(transaction);
  }

  // Debug helper
  dump(collection?: string) {
    if (collection) return this.storage[collection];
    return this.storage;
  }
}

// Use globalThis to ensure the SAME instance across all module contexts
function getGlobalMockDb(): MockDB {
  if (!(globalThis as any)[GLOBAL_KEY]) {
    console.log('[MockDB] Creating new global instance');
    (globalThis as any)[GLOBAL_KEY] = new MockDB();
  }
  return (globalThis as any)[GLOBAL_KEY];
}

export const mockDb = getGlobalMockDb();
