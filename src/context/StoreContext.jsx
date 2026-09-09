import React, { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const StoreProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreIdState] = useState(() => {
    return localStorage.getItem('superAdminSelectedStoreId') || null;
  });
  const [loadingStores, setLoadingStores] = useState(true);
  const [storesError, setStoresError] = useState(null);

  const setSelectedStoreId = (id) => {
    setSelectedStoreIdState(id);
    if (id) {
      localStorage.setItem('superAdminSelectedStoreId', id);
    } else {
      localStorage.removeItem('superAdminSelectedStoreId');
    }
  };

  const fetchStores = async () => {
    setLoadingStores(true);
    setStoresError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setLoadingStores(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/super-admin/stores`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const storeList = data.stores || data.data || [];
        setStores(storeList);

        // If no store selected or saved store ID is no longer valid, default to first store
        const savedId = localStorage.getItem('superAdminSelectedStoreId');
        if (storeList.length > 0) {
          if (!savedId || !storeList.some(s => s.id === savedId)) {
            setSelectedStoreId(storeList[0].id);
          } else if (savedId && (!selectedStoreId || selectedStoreId !== savedId)) {
            setSelectedStoreId(savedId);
          }
        }
      } else {
        setStoresError(data.message || 'Failed to load stores list.');
      }
    } catch (err) {
      console.error('Error fetching stores for Super Admin:', err);
      setStoresError('Network error loading stores.');
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const selectedStore = stores.find(s => s.id === selectedStoreId) || stores[0] || null;

  return (
    <StoreContext.Provider
      value={{
        stores,
        selectedStore,
        selectedStoreId: selectedStore?.id || selectedStoreId,
        setSelectedStoreId,
        loadingStores,
        storesError,
        refreshStores: fetchStores
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
