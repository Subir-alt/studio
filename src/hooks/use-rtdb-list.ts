
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref as dbRef, onValue, set, child, update as rtdbUpdate, remove as rtdbRemove, off } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

const database = getDatabase(firebaseApp);

export interface ItemWithId {
  id: string;
  // ownerUid?: string; // No longer needed directly on item if path contains UID
}

/**
 * A hook to manage a list of items in Firebase Realtime Database, scoped to the current user.
 * @param basePath The base path in RTDB for this type of item (e.g., 'ideas', 'familyMembers').
 * @returns An object with the items, functions to modify them, loading state, and error state.
 */
function useRtdbList<T extends ItemWithId>(
  basePath: string // e.g., 'ideas', 'familyMembers'
): {
  items: T[];
  addItem: (itemData: Omit<T, 'id'>) => Promise<T>;
  updateItem: (id: string, updates: Partial<Omit<T, 'id'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
} {
  const { user, loading: authLoading } = useAuth(); // Get current user
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [currentUserPath, setCurrentUserPath] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setItems([]);
      setLoading(false);
      // setError(new Error("User not authenticated. Cannot fetch data."));
      // Or simply show no data and no error if this is expected behavior for logged-out users.
      // For this app, we usually expect a user to be logged in to see data.
      setCurrentUserPath(null);
      return;
    }

    if (!basePath) {
      setLoading(false);
      setError(new Error("RTDB basePath cannot be empty."));
      setCurrentUserPath(null);
      return;
    }
    
    const path = `users/${user.uid}/${basePath}`;
    setCurrentUserPath(path);

  }, [user, authLoading, basePath]);


  useEffect(() => {
    if (!currentUserPath) {
      // If no user path (e.g., logged out or still loading auth), don't try to fetch.
      if (!authLoading) setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    const pathReference = dbRef(database, currentUserPath);

    const handleValueChange = onValue(
      pathReference,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const itemList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          })) as T[];
          setItems(itemList);
        } else {
          setItems([]);
        }
        setLoading(false);
      },
      (err: Error) => {
        console.error(`Error fetching data from RTDB path "${currentUserPath}":`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      off(pathReference, 'value', handleValueChange);
    };
  }, [currentUserPath, authLoading]);

  const addItem = useCallback(
    async (itemData: Omit<T, 'id'>): Promise<T> => {
      if (!currentUserPath) {
        throw new Error("Cannot add item: User not authenticated or path not set.");
      }
      const newItemId = uuidv4();
      const itemReference = child(dbRef(database, currentUserPath), newItemId);
      // const dataToSave = { ...itemData, ownerUid: user.uid }; // ownerUid is implicit in path
      await set(itemReference, itemData);
      return { id: newItemId, ...itemData } as T;
    },
    [currentUserPath] // user object itself is not needed if currentUserPath updates correctly
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<Omit<T, 'id'>>) => {
      if (!currentUserPath) {
        throw new Error("Cannot update item: User not authenticated or path not set.");
      }
      if (!id) throw new Error("Item ID is required for update.");
      const itemReference = child(dbRef(database, currentUserPath), id);
      await rtdbUpdate(itemReference, updates);
    },
    [currentUserPath]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!currentUserPath) {
        throw new Error("Cannot delete item: User not authenticated or path not set.");
      }
      if (!id) throw new Error("Item ID is required for delete.");
      const itemReference = child(dbRef(database, currentUserPath), id);
      await rtdbRemove(itemReference);
    },
    [currentUserPath]
  );

  return { items, addItem, updateItem, deleteItem, loading: loading || authLoading, error };
}

export default useRtdbList;
