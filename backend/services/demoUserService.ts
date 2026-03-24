import Portfolio from '../models/Portfolio_model';
import PerformanceAnalytics from '../models/PerformanceAnalytics_model';
import Transaction from '../models/Transaction_model';
import { IAsset } from '../models/Portfolio_model';
import { IPerformanceData } from '../models/PerformanceAnalytics_model';
import { ITransaction } from '../models/Transaction_model';
import { getPriceData } from './priceFeedService';

const DEMO_USER_ID = 'demo-user';

interface DemoAsset extends IAsset {
  historicalPrices: number[];
}

export const createDemoUser = async () => {
  try {
    console.log('Creating demo user...');
    const priceData = await getPriceData();
    const demoAssets = generateDemoAssets(priceData);
    const performanceData = generatePerformanceData(demoAssets);
    const demoTransactions = generateDemoTransactions(demoAssets);

    // Create demo portfolio
    const portfolio = new Portfolio({
      userId: DEMO_USER_ID,
      assets: demoAssets.map(asset => ({
        name: asset.name,
        symbol: asset.symbol,
        amount: asset.amount,
        value: asset.value,
        change24h: asset.change24h,
        image: asset.image,
      })),
      totalValue: demoAssets.reduce((sum, asset) => sum + asset.value, 0),
      totalChange24h: demoAssets.reduce((sum, asset) => sum + (asset.value * asset.change24h / 100), 0),
      lastUpdated: new Date(),
    });

    // Create demo performance analytics
    const performanceAnalytics = new PerformanceAnalytics({
      userId: DEMO_USER_ID,
      data: performanceData,
    });

    // Save demo transactions
    await Transaction.insertMany(demoTransactions);

    await portfolio.save();
    await performanceAnalytics.save();

    console.log('Demo user created successfully');
    return { portfolio, performanceAnalytics, transactions: demoTransactions };
  } catch (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
};

const generateDemoAssets = (priceData: any): DemoAsset[] => {
  console.log('Generating demo assets...');
  return Object.values(priceData).slice(0, 5).map((coin: any) => ({
    name: coin.name,
    symbol: coin.symbol,
    amount: parseFloat((Math.random() * 10).toFixed(4)),
    value: coin.current_price * parseFloat((Math.random() * 10).toFixed(4)),
    change24h: coin.price_change_percentage_24h,
    image: coin.image,
    historicalPrices: generateHistoricalPrices(coin.current_price, 365),
  }));
};

const generateHistoricalPrices = (currentPrice: number, days: number): number[] => {
  const prices = [currentPrice];
  for (let i = 1; i < days; i++) {
    const change = (Math.random() - 0.5) * 0.05; // Daily change between -2.5% and 2.5%
    prices.unshift(prices[0] * (1 + change));
  }
  return prices;
};

const generatePerformanceData = (assets: DemoAsset[]): IPerformanceData[] => {
  console.log('Generating performance data...');
  const performanceData: IPerformanceData[] = [];
  const days = assets[0].historicalPrices.length;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));

    const dailyData: IPerformanceData = {
      date,
      totalValue: 0,
      dailyReturn: 0,
      assets: {},
    };

    assets.forEach(asset => {
      const value = asset.amount * asset.historicalPrices[i];
      dailyData.totalValue += value;
      dailyData.assets[asset.symbol] = { value, amount: asset.amount };
    });

    if (i > 0) {
      const previousValue = performanceData[i - 1].totalValue;
      dailyData.dailyReturn = (dailyData.totalValue - previousValue) / previousValue;
    }

    performanceData.push(dailyData);
  }

  return performanceData;
};

const generateDemoTransactions = (assets: DemoAsset[]): ITransaction[] => {
  console.log('Generating demo transactions...');
  const transactions: ITransaction[] = [];
  const now = new Date();

  assets.forEach(asset => {
    // Generate a buy transaction for each asset
    transactions.push({
      userId: DEMO_USER_ID,
      type: 'buy',
      asset: asset.symbol,
      amount: asset.amount,
      price: asset.value / asset.amount,
      date: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      status: 'completed',
      totalValue: asset.value,
    } as ITransaction);

    // Generate 1-3 additional random transactions for each asset
    const additionalTransactions = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < additionalTransactions; i++) {
      const isBuy = Math.random() > 0.5;
      const amount = isBuy ? Math.random() * asset.amount : Math.random() * (asset.amount / 2);
      const price = asset.value / asset.amount * (1 + (Math.random() - 0.5) * 0.1); // Price with ±5% variation

      transactions.push({
        userId: DEMO_USER_ID,
        type: isBuy ? 'buy' : 'sell',
        asset: asset.symbol,
        amount: amount,
        price: price,
        date: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        status: 'completed',
        totalValue: amount * price,
      } as ITransaction);
    }
  });

  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date, most recent first
};

export const getDemoPortfolio = async () => {
  try {
    console.log('Fetching demo portfolio...');
    const portfolio = await Portfolio.findOne({ userId: DEMO_USER_ID });
    if (portfolio) {
      console.log('Demo portfolio found');
    } else {
      console.log('Demo portfolio not found');
    }
    return portfolio;
  } catch (error) {
    console.error('Error fetching demo portfolio:', error);
    throw error;
  }
};

export const getDemoPerformanceData = async () => {
  try {
    console.log('Fetching demo performance data...');
    const performanceData = await PerformanceAnalytics.findOne({ userId: DEMO_USER_ID });
    if (performanceData) {
      console.log('Demo performance data found');
    } else {
      console.log('Demo performance data not found');
    }
    return performanceData;
  } catch (error) {
    console.error('Error fetching demo performance data:', error);
    throw error;
  }
};

export const getOrCreateDemoUser = async (userId: string) => {
  try {
    console.log('Getting or creating demo user data...');
    let portfolio = await Portfolio.findOne({ userId });
    let performanceAnalytics = await PerformanceAnalytics.findOne({ userId });
    let transactions = await Transaction.find({ userId });

    if (!portfolio || !performanceAnalytics || transactions.length === 0) {
      console.log('Demo user data not found or incomplete, creating new demo data...');
      const priceData = await getPriceData();
      const demoAssets = generateDemoAssets(priceData);
      const performanceData = generatePerformanceData(demoAssets);
      const demoTransactions = generateDemoTransactions(demoAssets);

      portfolio = new Portfolio({
        userId,
        assets: demoAssets.map(asset => ({
          name: asset.name,
          symbol: asset.symbol,
          amount: asset.amount,
          value: asset.value,
          change24h: asset.change24h,
          image: asset.image,
        })),
        totalValue: demoAssets.reduce((sum, asset) => sum + asset.value, 0),
        totalChange24h: demoAssets.reduce((sum, asset) => sum + (asset.value * asset.change24h / 100), 0),
        lastUpdated: new Date(),
      });

      performanceAnalytics = new PerformanceAnalytics({
        userId,
        data: performanceData,
      });

      await Transaction.deleteMany({ userId });
      transactions = await Transaction.insertMany(
        demoTransactions.map(t => ({ ...t, userId }))
      );

      await portfolio.save();
      await performanceAnalytics.save();
    }

    console.log('Demo user data retrieved successfully');
    return { portfolio, performanceAnalytics, transactions };
  } catch (error) {
    console.error('Error in getOrCreateDemoUser:', error);
    throw error;
  }
};