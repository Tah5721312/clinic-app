import { useState, useEffect } from 'react';

interface RevenueData {
  total: number;
  monthly: number;
  daily: number;
  paid: number;
  remaining: number;
}

interface UseRevenueReturn {
  data: RevenueData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRevenue(): UseRevenueReturn {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/revenue?type=all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const revenueData = await response.json();
      setData(revenueData);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchRevenue,
  };
}
