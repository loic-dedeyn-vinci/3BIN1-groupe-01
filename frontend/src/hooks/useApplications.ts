import { useEffect, useState } from "react";
import type { Application } from "../models/application.ts";
import {
  getApplications,
  withdrawApplication,
} from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useApplications = (token: string, onUnauthorized: () => void) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getApplications(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setApplications(data);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) onUnauthorized();
        else setError(reason instanceof Error ? reason.message : "Erreur inconnue");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [onUnauthorized, token]);

  const withdraw = async (id: number): Promise<void> => {
    try {
      await withdrawApplication(token, id);
      const data = await getApplications(token);
      setApplications(data);
      setError(null);
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) onUnauthorized();
      else setError(reason instanceof Error ? reason.message : "Erreur inconnue");
    }
  };

  return { applications, isLoading, error, withdraw };
};