import { Response } from 'express';
import Portfolio, { IPortfolio, IAsset } from '../models/Portfolio_model';
import PerformanceAnalytics from '../models/PerformanceAnalytics_model';
import { getPriceData, CoinData } from '../services/priceFeedService';
import { UserRequest } from '../types';

interface HistoricalPrices {
  current: number;
  day: number;
  week: number;
  month: number;
  initial: number;
}

const getHistoricalPrices = async (userId: string, currentValue: number): Promise<HistoricalPrices> => {
  try {
    const performanceAnalytics = await PerformanceAnalytics.findOne({ userId })
      .sort({ 'data.date': -1 });

    if (!performanceAnalytics || !performanceAnalytics.data.length) {
      console.log('No historical data found, using current value for initialization');
      return {
        current: currentValue,
        day: currentValue,
        week: currentValue,
        month: currentValue,
        initial: currentValue
      };
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sortedData = performanceAnalytics.data
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const findClosestValue = (targetDate: Date): number => {
      const closest = sortedData.reduce((prev, curr) => {
        const currDiff = Math.abs(new Date(curr.date).getTime() - targetDate.getTime());
        const prevDiff = Math.abs(new Date(prev.date).getTime() - targetDate.getTime());
        return currDiff < prevDiff ? curr : prev;
      });
      return closest.totalValue;
    };

    const dayValue = findClosestValue(oneDayAgo);
    const weekValue = findClosestValue(sevenDaysAgo);
    const monthValue = findClosestValue(thirtyDaysAgo);
    const initialValue = sortedData[sortedData.length - 1].totalValue;

    console.log('Historical values found:', {
      current: currentValue,
      day: dayValue,
      week: weekValue,
      month: monthValue,
      initial: initialValue
    });

    return {
      current: currentValue,
      day: dayValue,
      week: weekValue,
      month: monthValue,
      initial: initialValue || currentValue
    };
  } catch (error) {
    console.error('Error getting historical prices:', error);
    return {
      current: currentValue,
      day: currentValue,
      week: currentValue,
      month: currentValue,
      initial: currentValue
    };
  }
};

const calculateChanges = (prices: HistoricalPrices) => {
  const changes = {
    change24h: prices.current - prices.day,
    change7d: prices.current - prices.week,
    change30d: prices.current - prices.month,
    changeAllTime: prices.current - prices.initial
  };

  console.log('Calculated changes:', changes);
  return changes;
};

const updateAssetPrices = async (assets: IAsset[], priceData: CoinData[]): Promise<{
  updatedAssets: IAsset[];
  totalValue: number;
  initialInvestment: number;
}> => {
  let totalValue = 0;
  let initialInvestment = 0;

  const updatedAssets = assets.map(asset => {
    const coinData = priceData.find(
      coin => coin.symbol.toLowerCase() === asset.symbol.toLowerCase()
    );

    if (coinData) {
      const currentValue = asset.amount * coinData.current_price;
      // Use existing initialValue or current value if not set
      const assetInitialValue = asset.initialValue || currentValue;

      totalValue += currentValue;
      initialInvestment += assetInitialValue;

      return {
        ...asset,
        value: currentValue,
        change24h: coinData.price_change_percentage_24h || 0,
        initialValue: assetInitialValue,
        image: coinData.image
      };
    }
    return asset;
  });

  return { updatedAssets, totalValue, initialInvestment };
};

export const getPortfolio = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const priceData = await getPriceData();
    let portfolio = await Portfolio.findOne({ userId });

    if (!portfolio) {
      console.log('Creating new portfolio');
      const sampleAssets = createSamplePortfolio(priceData);
      const { updatedAssets, totalValue, initialInvestment } = await updateAssetPrices(sampleAssets, priceData);

      portfolio = new Portfolio({
        userId,
        assets: updatedAssets,
        totalValue,
        initialInvestment,
        totalChange24h: 0,
        totalChange7d: 0,
        totalChange30d: 0,
        totalChangeAllTime: 0,
        createdAt: new Date(),
        lastUpdated: new Date()
      });
    } else {
      console.log('Updating existing portfolio');
      const { updatedAssets, totalValue, initialInvestment } = await updateAssetPrices(portfolio.assets, priceData);
      
      // Get historical prices and calculate changes
      const historicalPrices = await getHistoricalPrices(userId, totalValue);
      const changes = calculateChanges(historicalPrices);

      portfolio.assets = updatedAssets;
      portfolio.totalValue = totalValue;
      portfolio.initialInvestment = portfolio.initialInvestment || initialInvestment;
      portfolio.totalChange24h = changes.change24h;
      portfolio.totalChange7d = changes.change7d;
      portfolio.totalChange30d = changes.change30d;
      portfolio.totalChangeAllTime = changes.changeAllTime;
      portfolio.lastUpdated = new Date();
    }

    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    console.error('Error in getPortfolio:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createSamplePortfolio = (priceData: CoinData[]): IAsset[] => {
  return priceData
    .slice(0, 5)
    .map(coin => {
      const amount = parseFloat((Math.random() * 10).toFixed(4));
      const value = amount * coin.current_price;
      
      return {
        name: coin.name,
        symbol: coin.symbol,
        amount,
        value,
        change24h: coin.price_change_percentage_24h || 0,
        change7d: 0,
        change30d: 0,
        image: coin.image,
        initialValue: value // Set initial value when creating new assets
      };
    });
};

export const updatePortfolio = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { assets } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!Array.isArray(assets)) {
      return res.status(400).json({ message: 'Invalid assets data' });
    }

    const priceData = await getPriceData();
    let totalValue = 0;
    let totalChange24h = 0;

    const updatedAssets: IAsset[] = assets.map((asset) => {
      const coinData = priceData.find(coin => coin.symbol.toLowerCase() === asset.symbol.toLowerCase());
      const price = coinData?.current_price || 0;
      const change24h = coinData?.price_change_percentage_24h || 0;
      const value = asset.amount * price;

      totalValue += value;
      totalChange24h += value * (change24h / 100);

      return {
        name: asset.name,
        symbol: asset.symbol,
        amount: asset.amount,
        value,
        change24h,
      };
    });

    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { userId },
      {
        assets: updatedAssets,
        totalValue,
        totalChange24h,
        lastUpdated: new Date(),
      },
      { new: true, upsert: true }
    );

    res.json(updatedPortfolio);
  } catch (error) {
    console.error('Error in updatePortfolio:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addAsset = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, symbol, amount } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!name || !symbol || amount === undefined) {
      return res.status(400).json({ message: 'Missing required asset information' });
    }

    const priceData = await getPriceData();
    const coinData = priceData.find(coin => coin.symbol.toLowerCase() === symbol.toLowerCase());
    const price = coinData?.current_price || 0;
    const change24h = coinData?.price_change_percentage_24h || 0;
    const value = amount * price;

    const portfolio = await Portfolio.findOne({ userId });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    portfolio.assets.push({
      name,
      symbol,
      amount,
      value,
      change24h,
    });

    portfolio.totalValue += value;
    portfolio.totalChange24h += value * (change24h / 100);
    portfolio.lastUpdated = new Date();

    await portfolio.save();

    res.json(portfolio);
  } catch (error) {
    console.error('Error in addAsset:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeAsset = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { symbol } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const portfolio = await Portfolio.findOne({ userId });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const assetIndex = portfolio.assets.findIndex((asset) => asset.symbol === symbol);

    if (assetIndex === -1) {
      return res.status(404).json({ message: 'Asset not found in portfolio' });
    }

    const removedAsset = portfolio.assets[assetIndex];
    portfolio.totalValue -= removedAsset.value;
    portfolio.totalChange24h -= removedAsset.value * (removedAsset.change24h / 100);
    portfolio.assets.splice(assetIndex, 1);
    portfolio.lastUpdated = new Date();

    await portfolio.save();

    res.json(portfolio);
  } catch (error) {
    console.error('Error in removeAsset:', error);
    res.status(500).json({ message: 'Server error' });
  }
};