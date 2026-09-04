'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import type { CollectionObject } from '@/lib/types';
import { deleteObject, listObjects } from './api';
import { PAGE_SIZE } from './constants';

const byNewestFirst = (a: CollectionObject, b: CollectionObject) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const mergeUnique = (
  current: CollectionObject[],
  incoming: CollectionObject[],
) => {
  const seen = new Set(current.map((o) => o.id));
  return [...current, ...incoming.filter((o) => !seen.has(o.id))];
};

/**
 * Holds the live list of objects: seeded from the server-rendered first page,
 * paginated with `loadMore` (GET /objects?limit=&skip=), and kept in sync via
 * Socket.IO. `serverCount` tracks how many list-fetched items are on screen so
 * `skip` stays right even as live `object:created` events prepend new cards.
 */
export function useObjects(initial: CollectionObject[]) {
  const [objects, setObjects] = useState(initial);
  const [connected, setConnected] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE);
  const serverCount = useRef(initial.length);

  const removeObject = useCallback(async (id: string) => {
    let removed: CollectionObject | undefined;
    setObjects((current) => {
      removed = current.find((o) => o.id === id);
      return current.filter((o) => o.id !== id);
    });
    if (removed) serverCount.current = Math.max(0, serverCount.current - 1);
    try {
      await deleteObject(id);
    } catch (error) {
      if (removed) {
        // Roll the optimistic removal back.
        serverCount.current += 1;
        setObjects((current) => [removed!, ...current].sort(byNewestFirst));
      }
      throw error;
    }
  }, []);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const page = await listObjects({
        limit: PAGE_SIZE,
        skip: serverCount.current,
      });
      serverCount.current += page.length;
      setObjects((current) => mergeUnique(current, page));
      setHasMore(page.length === PAGE_SIZE);
    } catch {
      /* leave the button so the user can retry */
    } finally {
      setLoadingMore(false);
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
    const onUpdated = (object: CollectionObject) =>
      setObjects((current) =>
        current.map((o) => (o.id === object.id ? object : o)),
      );
    const onDeleted = ({ id }: { id: string }) =>
      setObjects((current) => {
        if (!current.some((o) => o.id === id)) return current;
        serverCount.current = Math.max(0, serverCount.current - 1);
        return current.filter((o) => o.id !== id);
      });

    // On (re)connect, re-pull the window we currently show so anything missed
    // while offline is reconciled without losing the user's paging position.
    const reconcile = () => {
      const limit = Math.min(Math.max(serverCount.current, PAGE_SIZE), 200);
      listObjects({ limit })
        .then((fresh) => {
          serverCount.current = fresh.length;
          setObjects(fresh);
          setHasMore(fresh.length === limit);
        })
        .catch(() => {
          /* keep the current list if the refetch fails */
        });
    };
    const onConnect = () => {
      setConnected(true);
      reconcile();
    };
    const onDisconnect = () => setConnected(false);

    socket.on('object:created', onCreated);
    socket.on('object:updated', onUpdated);
    socket.on('object:deleted', onDeleted);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setConnected(socket.connected);
    if (socket.connected) reconcile();

    return () => {
      socket.off('object:created', onCreated);
      socket.off('object:updated', onUpdated);
      socket.off('object:deleted', onDeleted);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { objects, removeObject, connected, loadMore, loadingMore, hasMore };
}
