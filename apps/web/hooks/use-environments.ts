"use client";

import { useState, useEffect } from "react";

interface Environment {
  id: string;
  name: string;
  baseUrl: string;
}

export function useEnvironments() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEnvs = async () => {
      try {
        const res = await fetch("/api/environments");
        if (res.ok) {
          const data = await res.json();
          setEnvironments(data);
        }
      } catch (e) {
        console.error("Failed to fetch environments", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnvs();
  }, []);

  return { environments, isLoading };
}
