import { database } from '../firebase/config';
import { ref, set, get, update, remove, onValue, off, push, query, orderByChild, equalTo } from 'firebase/database';
import { DATABASE_PATHS, getBinStatus, BIN_STATUS } from '../utils/constants';

const binsRef = ref(database, DATABASE_PATHS.BINS);

export const binService = {
  async createBin(binData) {
    const binId = binData.binId || `BIN-${Date.now()}`;
    const bin = {
      binId,
      name: binData.name || binId,
      fillLevel: 0,
      distance: 100,
      battery: 100,
      networkStatus: 'online',
      zone: binData.zone || 'Zone A - Central',
      location: {
        lat: binData.lat || 0,
        lng: binData.lng || 0,
        address: binData.address || ''
      },
      capacity: binData.capacity || 100,
      lastUpdate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    await set(ref(database, `${DATABASE_PATHS.BINS}/${binId}`), bin);
    return bin;
  },

  async getBin(binId) {
    const snapshot = await get(ref(database, `${DATABASE_PATHS.BINS}/${binId}`));
    if (!snapshot.exists()) return null;
    const data = snapshot.val();
    return { ...data, status: getBinStatus(data.fillLevel, data.networkStatus) };
  },

  async getAllBins() {
    const snapshot = await get(binsRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data).map(key => {
      const bin = data[key];
      return { ...bin, status: getBinStatus(bin.fillLevel, bin.networkStatus) };
    });
  },

  async updateBin(binId, updates) {
    await update(ref(database, `${DATABASE_PATHS.BINS}/${binId}`), {
      ...updates,
      lastUpdate: new Date().toISOString()
    });
    return this.getBin(binId);
  },

  async deleteBin(binId) {
    await remove(ref(database, `${DATABASE_PATHS.BINS}/${binId}`));
  },

  async updateBinFromESP32(binId, espData) {
    const { fillLevel, distance, battery, networkStatus } = espData;
    await update(ref(database, `${DATABASE_PATHS.BINS}/${binId}`), {
      fillLevel,
      distance,
      battery,
      networkStatus: networkStatus || 'online',
      lastUpdate: new Date().toISOString(),
      lastESP32Update: new Date().toISOString()
    });
    return this.getBin(binId);
  },

  subscribeToBins(callback) {
    const unsubscribe = onValue(binsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const bins = Object.keys(data).map(key => {
        const bin = data[key];
        return { ...bin, status: getBinStatus(bin.fillLevel, bin.networkStatus) };
      });
      callback(bins);
    });
    return () => off(binsRef, 'value', unsubscribe);
  },

  subscribeToBin(binId, callback) {
    const binRef = ref(database, `${DATABASE_PATHS.BINS}/${binId}`);
    const unsubscribe = onValue(binRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const data = snapshot.val();
      callback({ ...data, status: getBinStatus(data.fillLevel, data.networkStatus) });
    });
    return () => off(binRef, 'value', unsubscribe);
  },

  async getBinsByZone(zone) {
    const snapshot = await get(binsRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data)
      .map(key => {
        const bin = data[key];
        return { ...bin, status: getBinStatus(bin.fillLevel, bin.networkStatus) };
      })
      .filter(bin => bin.zone === zone);
  },

  async getBinsByStatus(status) {
    const bins = await this.getAllBins();
    return bins.filter(bin => bin.status === status);
  },

  getStatistics(bins) {
    const stats = {
      total: bins.length,
      full: 0,
      medium: 0,
      empty: 0,
      offline: 0,
      online: 0,
      avgFillLevel: 0,
      avgBattery: 0,
      lowBattery: 0
    };

    if (bins.length === 0) return stats;

    let totalFill = 0;
    let totalBattery = 0;

    bins.forEach(bin => {
      switch (bin.status) {
        case BIN_STATUS.FULL:
          stats.full++;
          break;
        case BIN_STATUS.MEDIUM:
          stats.medium++;
          break;
        case BIN_STATUS.EMPTY:
          stats.empty++;
          break;
        case BIN_STATUS.OFFLINE:
          stats.offline++;
          break;
      }

      if (bin.networkStatus === 'online' || bin.networkStatus === true) {
        stats.online++;
      } else {
        stats.offline++;
      }

      totalFill += bin.fillLevel || 0;
      totalBattery += bin.battery || 0;

      if ((bin.battery || 0) < 20) {
        stats.lowBattery++;
      }
    });

    stats.avgFillLevel = Math.round(totalFill / bins.length);
    stats.avgBattery = Math.round(totalBattery / bins.length);

    return stats;
  },

  async recordBinHistory(binId, data) {
    const historyRef = ref(database, `${DATABASE_PATHS.BINS}/${binId}/history`);
    await push(historyRef, {
      ...data,
      timestamp: new Date().toISOString()
    });
  },

  async getBinHistory(binId, limit = 50) {
    const historyRef = ref(database, `${DATABASE_PATHS.BINS}/${binId}/history`);
    const snapshot = await get(historyRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data)
      .map(key => ({ id: key, ...data[key] }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
};

export default binService;
