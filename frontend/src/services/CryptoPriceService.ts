import axios from 'axios';
import { BehaviorSubject, Subject } from 'rxjs';

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
}

export interface ServiceStatus {
  status: 'idle' | 'loading' | 'error' | 'rate-limited';
  message?: string;
  retryAfter?: number;
}

class CryptoPriceService {
  private static instance: CryptoPriceService;
  private prices: BehaviorSubject<CryptoPrice[]>;
  private status: BehaviorSubject<ServiceStatus>;
  private errorSubject: Subject<Error>;
  private lastFetchTime: number = 0;
  private readonly MIN_FETCH_INTERVAL = 30000; // 30 seconds
  private readonly API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  private isLoading = false;
  private retryTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.prices = new BehaviorSubject<CryptoPrice[]>([]);
    this.status = new BehaviorSubject<ServiceStatus>({ status: 'idle' });
    this.errorSubject = new Subject<Error>();
    this.initializeDataFetching();
  }

  public static getInstance(): CryptoPriceService {
    if (!CryptoPriceService.instance) {
      CryptoPriceService.instance = new CryptoPriceService();
    }
    return CryptoPriceService.instance;
  }

  private async initializeDataFetching() {
    await this.fetchPrices();
    setInterval(() => {
      if (Date.now() - this.lastFetchTime >= this.MIN_FETCH_INTERVAL) {
        this.fetchPrices();
      }
    }, this.MIN_FETCH_INTERVAL);
  }

  private async fetchPrices() {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      this.status.next({ status: 'loading' });
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
  
      const response = await axios.get<CryptoPrice[]>(`${this.API_BASE_URL}/api/price-feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      this.prices.next(response.data);
      this.status.next({ status: 'idle' });
      this.lastFetchTime = Date.now();
      
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }

    } catch (err: unknown) {
      console.error('Error fetching crypto prices:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          const retryAfter = err.response.headers['retry-after'] 
            ? parseInt(err.response.headers['retry-after']) * 1000 
            : 60000;
          
          this.status.next({ 
            status: 'rate-limited',
            message: 'Rate limit exceeded. Waiting before retrying...',
            retryAfter
          });

          this.retryTimeout = setTimeout(() => {
            this.fetchPrices();
          }, retryAfter);
        } else {
          this.status.next({ 
            status: 'error',
            message: err.response?.data?.message || 'Failed to fetch price data'
          });
          this.errorSubject.next(err);
        }
      } else if (err instanceof Error) {
        this.status.next({ 
          status: 'error',
          message: err.message
        });
        this.errorSubject.next(err);
      } else {
        this.status.next({ 
          status: 'error',
          message: 'An unknown error occurred while fetching prices'
        });
        this.errorSubject.next(new Error('Unknown error'));
      }
    } finally {
      this.isLoading = false;
    }
  }

  public getPricesObservable() {
    return this.prices.asObservable();
  }

  public getStatusObservable() {
    return this.status.asObservable();
  }

  public getErrorObservable() {
    return this.errorSubject.asObservable();
  }

  public getCurrentPrices() {
    return this.prices.getValue();
  }

  public getCurrentStatus() {
    return this.status.getValue();
  }

  public async refreshPrices() {
    if (Date.now() - this.lastFetchTime >= this.MIN_FETCH_INTERVAL) {
      return this.fetchPrices();
    }
  }

  public cleanup() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }
}

export const cryptoPriceService = CryptoPriceService.getInstance();
export default cryptoPriceService;