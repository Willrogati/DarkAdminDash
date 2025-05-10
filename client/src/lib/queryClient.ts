import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  credentials?: RequestCredentials;
}

export async function apiRequest(
  url: string,
  options: RequestOptions = {}
): Promise<any> {
  const defaultOptions: RequestOptions = {
    method: "GET",
    headers: {},
    credentials: "include",
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers },
  };

  const res = await fetch(url, mergedOptions as RequestInit);

  await throwIfResNotOk(res);
  return res.json().catch(() => ({}));
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async (url: string, requestOptions?: RequestOptions): Promise<T | null> => {
    const defaultOptions: RequestOptions = {
      method: "GET",
      credentials: "include",
    };

    const mergedOptions = {
      ...defaultOptions,
      ...requestOptions,
    };

    const res = await fetch(url, mergedOptions as RequestInit);

    if (options.on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
};

const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const [url, ...rest] = queryKey;
  const res = await fetch(url as string, {
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
