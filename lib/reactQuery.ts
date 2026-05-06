import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5분
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // 서버: 매번 새 QueryClient 생성
    return makeQueryClient();
  }
  // 브라우저: 없을 때만 생성
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
