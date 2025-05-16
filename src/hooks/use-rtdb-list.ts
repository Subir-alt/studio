
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref as dbRef, onValue, set, child, update as rtdbUpdate, remove as rtdbRemove, off } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { firebaseApp } from '@/lib/firebase';

const database = getDatabase(firebaseApp);

export interface ItemWithId {
  id: string;
}

/**
 * A hook to manage a list of items in Firebase Realtime Database.
 * @param listPath The path in RTDB where the list is stored.
 * @returns An object with the items, functions to modify them, loading state, and error state.
 */
function useRtdbList<T extends ItemWithId>(
  listPath: string
): {
  items: T[];
  addItem: (itemData: Omit<T, 'id'>) => Promise<T>;
  updateItem: (id: string, updates: Partial<Omit<T, 'id'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
} {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!listPath) {
      setLoading(false);
      setError(new Error("RTDB listPath cannot be empty."));
      return;
    }

    const pathReference = dbRef(database, listPath);
    setLoading(true);
    setError(null);

    const handleValueChange = onValue(
      pathReference,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert RTDB object (keys are IDs) to an array of items
          const itemList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          })) as T[];
          setItems(itemList);
        } else {
          setItems([]); // No data at this path
        }
        setLoading(false);
      },
      (err: Error) => {
        console.error(`Error fetching data from RTDB path "${listPath}":`, err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => {
      off(pathReference, 'value', handleValueChange);
    };
  }, [listPath]);

  const addItem = useCallback(
    async (itemData: Omit<T, 'id'>): Promise<T> => {
      const newItemId = uuidv4();
      // The object stored in RTDB should NOT contain its own key (id) as a property.
      const itemReference = child(dbRef(database, listPath), newItemId);
      await set(itemReference, itemData);
      return { id: newItemId, ...itemData } as T; // Return the full item including the new ID
    },
    [listPath]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<Omit<T, 'id'>>) => {
      if (!id) throw new Error("Item ID is required for update.");
      const itemReference = child(dbRef(database, listPath), id);
      await rtdbUpdate(itemReference, updates);
    },
    [listPath]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!id) throw new Error("Item ID is required for delete.");
      const itemReference = child(dbRef(database, listPath), id);
      await rtdbRemove(itemReference);
    },
    [listPath]
  );

  return { items, addItem, updateItem, deleteItem, loading, error };
}

export default useRtdbList;
