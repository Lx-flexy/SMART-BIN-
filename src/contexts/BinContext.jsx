import { createContext, useContext, useState, useEffect } from 'react';
import { binService } from '../services/binService';

const BinContext = createContext(null);

export const useBins = () => {
  const context = useContext(BinContext);
  if (!context) {
    throw new Error('useBins must be used within a BinProvider');
  }
  return context;
};

export const BinProvider = ({ children }) => {
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = binService.subscribeToBins((binData) => {
      setBins(binData);
      setStatistics(binService.getStatistics(binData));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createBin = async (binData) => {
    setError(null);
    try {
      return await binService.createBin(binData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateBin = async (binId, updates) => {
    setError(null);
    try {
      return await binService.updateBin(binId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteBin = async (binId) => {
    setError(null);
    try {
      await binService.deleteBin(binId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getBinById = (binId) => {
    return bins.find(bin => bin.binId === binId) || null;
  };

  const getBinsByZone = (zone) => {
    return bins.filter(bin => bin.zone === zone);
  };

  const getBinsByStatus = (status) => {
    return bins.filter(bin => bin.status === status);
  };

  const value = {
    bins,
    selectedBin,
    setSelectedBin,
    statistics,
    loading,
    error,
    createBin,
    updateBin,
    deleteBin,
    getBinById,
    getBinsByZone,
    getBinsByStatus,
    refreshBins: () => binService.getAllBins().then(setBins),
    setError
  };

  return (
    <BinContext.Provider value={value}>
      {children}
    </BinContext.Provider>
  );
};

export default BinContext;
