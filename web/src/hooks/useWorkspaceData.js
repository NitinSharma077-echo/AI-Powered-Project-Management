import { useCallback, useEffect, useState } from "react";

import {
  getProjects,
  getMeetings,
  getMeetingDecisions,
  getMeetingActionItems,
} from "../services/meetingService";

// Everything search and notifications need, fetched once and shared.
// Data is reused for CACHE_MS so opening the search box is instant.
const CACHE_MS = 60 * 1000;

let cache = null;
let cachedAt = 0;
let inflight = null;
const listeners = new Set();

async function fetchWorkspace() {
  const [projects, meetings] = await Promise.all([getProjects(), getMeetings()]);

  const perMeeting = await Promise.all(
    meetings.map(async (meeting) => {
      const [decisions, actionItems] = await Promise.all([
        getMeetingDecisions(meeting._id).catch(() => []),
        getMeetingActionItems(meeting._id).catch(() => []),
      ]);

      const tag = (item) => ({
        ...item,
        meetingId: meeting._id,
        meetingTitle: meeting.title,
      });

      return {
        decisions: decisions.map(tag),
        actionItems: actionItems.map(tag),
      };
    })
  );

  return {
    projects,
    meetings,
    decisions: perMeeting.flatMap((item) => item.decisions),
    actionItems: perMeeting.flatMap((item) => item.actionItems),
  };
}

function load(force = false) {
  if (!force && cache && Date.now() - cachedAt < CACHE_MS) {
    return Promise.resolve(cache);
  }

  if (!inflight) {
    inflight = fetchWorkspace()
      .then((data) => {
        cache = data;
        cachedAt = Date.now();
        listeners.forEach((listener) => listener(data));
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

// Call after creating, editing or deleting something so search and
// notifications reflect it on their next read.
export function invalidateWorkspace() {
  cachedAt = 0;
}

export default function useWorkspaceData({ enabled = true, refreshMs } = {}) {
  const [data, setData] = useState(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  const refresh = useCallback((force = true) => {
    setLoading(true);
    return load(force)
      .then((next) => {
        setError(null);
        return next;
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    listeners.add(setData);
    return () => listeners.delete(setData);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    refresh(false);

    if (!refreshMs) return undefined;
    const id = setInterval(() => refresh(true), refreshMs);
    return () => clearInterval(id);
  }, [enabled, refreshMs, refresh]);

  return { data, loading, error, refresh };
}
