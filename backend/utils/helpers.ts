export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  export const isRateLimitError = (error: any): boolean => {
    return error?.response?.status === 429;
  };
  
  export const backoffDelay = (attempt: number, baseDelay: number = 1000): number => {
    return Math.min(
      Math.pow(2, attempt) * baseDelay + Math.random() * baseDelay,
      30000
    );
  };