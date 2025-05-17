
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref as dbRef, onValue, set, child, update as rtdbUpdate, remove as rtdbRemove, off } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

const database = getDatabase(firebaseApp);

export interface ItemWithId {
  id: string;
}

interface RtdbListOptions {
  pathType?: 'userScoped' | 'globalRoot';
}

/**
 * A hook to manage a list of items in Firebase Realtime Database.
 * Can be scoped to the current user or use a global root path.
 * @param basePath The base path in RTDB. If pathType is 'userScoped', this is relative to 'users/USER_ID/'. If 'globalRoot', this is the absolute path.
 * @param options Configuration options, e.g., { pathType: 'globalRoot' }. Defaults to 'userScoped'.
 * @returns An object with the items, functions to modify them, loading state, and error state.
 */
function useRtdbList<T extends ItemWithId>(
  basePath: string,
  options?: RtdbListOptions
): {
  items: T[];
  addItem: (itemData: Omit<T, 'id' | 'createdByUid' | 'creatorDisplayName' | 'createdAt'> & Partial<Pick<T, 'createdByUid' | 'creatorDisplayName' | 'createdAt'>>) => Promise<T>;
  updateItem: (id: string, updates: Partial<Omit<T, 'id'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
} {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  const pathType = options?.pathType || 'userScoped';

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setItems([]);
      setLoading(false);
      setCurrentPath(null);
      return;
    }

    if (!basePath && pathType === 'userScoped') { // globalRoot can use basePath like "commonNotes" directly
      setLoading(false);
      setError(new Error("RTDB basePath cannot be empty for userScoped paths."));
      setCurrentPath(null);
      return;
    }
    
    let resolvedPath: string;
    if (pathType === 'globalRoot') {
      resolvedPath = basePath;
    } else { // userScoped
      resolvedPath = `users/${user.uid}/${basePath}`;
    }
    setCurrentPath(resolvedPath);

  }, [user, authLoading, basePath, pathType]);


  useEffect(() => {
    if (!currentPath) {
      if (!authLoading) setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    const pathReference = dbRef(database, currentPath);

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
        console.error(`Error fetching data from RTDB path "${currentPath}":`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      off(pathReference, 'value', handleValueChange);
    };
  }, [currentPath, authLoading]);

  const addItem = useCallback(
    async (itemData: Omit<T, 'id' | 'createdByUid' | 'creatorDisplayName' | 'createdAt'> & Partial<Pick<T, 'createdByUid' | 'creatorDisplayName' | 'createdAt'>>): Promise<T> => {
      if (!currentPath || !user) { // Also check for user for createdBy fields
        throw new Error("Cannot add item: User not authenticated or path not set.");
      }
      const newItemId = uuidv4();
      const itemReference = child(dbRef(database, currentPath), newItemId);
      
      let dataToSave: any = { ...itemData };
      if (!dataToSave.createdAt) {
        dataToSave.createdAt = new Date().toISOString();
      }

      if (pathType === 'globalRoot') {
        dataToSave.createdByUid = user.uid;
        dataToSave.creatorDisplayName = user.displayName || user.email || 'Anonymous';
      }
      
      await set(itemReference, dataToSave);
      return { id: newItemId, ...dataToSave } as T;
    },
    [currentPath, user, pathType]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<Omit<T, 'id'>>) => {
      if (!currentPath) {
        throw new Error("Cannot update item: User not authenticated or path not set.");
      }
      if (!id) throw new Error("Item ID is required for update.");
      const itemReference = child(dbRef(database, currentPath), id);
      await rtdbUpdate(itemReference, updates);
    },
    [currentPath]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!currentPath) {
        throw new Error("Cannot delete item: User not authenticated or path not set.");
      }
      if (!id) throw new Error("Item ID is required for delete.");
      const itemReference = child(dbRef(database, currentPath), id);
      await rtdbRemove(itemReference);
    },
    [currentPath]
  );

  return { items, addItem, updateItem, deleteItem, loading: loading || authLoading, error };
}

export default useRtdbList;
