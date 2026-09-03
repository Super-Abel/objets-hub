'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import type { CollectionObject } from '@/lib/types';
import { deleteObject, listObjects } from './api';

const byNewestFirst = (a: CollectionObject, b: CollectionObject) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/**
 * Holds the live list of objects: seeded from the server-rendered snapshot, kept
 * in sync via Socket.IO (`object:created` / `object:deleted`), and re-fetched on
 * every (re)connect so nothing created during a disconnect is missed.
 */
export function useObjects(initial: CollectionObject[]) {
  const [objects, setObjects] = useState(initial);

  const removeObject = useCallback(async (id: string) => {
    let removed: CollectionObject | undefined;
    setObjects((current) => {
      removed = current.find((o) => o.id === id);
      return current.filter((o) => o.id !== id);
    });
    try {
      await deleteObject(id);
    } catch (error) {
      if (removed) {
        // Roll the optimistic removal back.
        setObjects((current) => [removed!, ...current].sort(byNewestFirst));
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onCreated = (object: CollectionObject) =>
      setObjects((current) =>
        current.some((o) => o.id === object.id)
          ? current
          : [object, ...current],
      );
    const onDeleted = ({ id }: { id: string }) =>
      setObjects((current) => current.filter((o) => o.id !== id));
    const reconcile = () => {
      listObjects()
        .then(setObjects)
        .catch(() => {
          /* keep the current list if the refetch fails */
        });
    };

    socket.on('object:created', onCreated);
    socket.on('object:deleted', onDeleted);
    socket.on('connect', reconcile);
    if (socket.connected) reconcile();

    return () => {
      socket.off('object:created', onCreated);
      socket.off('object:deleted', onDeleted);
      socket.off('connect', reconcile);
    };
  }, []);

  return { objects, removeObject };
}
