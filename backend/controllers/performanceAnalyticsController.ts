import { Response } from 'express';
import { UserRequest } from '../types';
import PerformanceAnalytics, { IPerformanceData } from '../models/PerformanceAnalytics_model';
import Portfolio from '../models/Portfolio_model';
import { getPriceData } from '../services/priceFeedService';

export const getPerformanceData = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const performanceData = await PerformanceAnalytics.findOne({ userId });

    if (!performanceData) {
      return res.status(404).json({ message: 'Performance data not found' });
    }

    res.json(performanceData.data);
  } catch (error) {
    console.error('Error in getPerformanceData:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePerformanceData = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const priceData = await getPriceData();
    const currentDate = new Date();
    
    const newPerformanceData: IPerformanceData = {
      date: currentDate,
      totalValue: portfolio.totalValue,
      dailyReturn: calculateDailyReturn(portfolio.totalValue, portfolio.assets, priceData),
      assets: portfolio.assets.reduce((acc, asset) => {
        acc[asset.symbol] = {
          value: asset.value,
          amount: asset.amount,
        };
        return acc;
      }, {} as IPerformanceData['assets']),
    };

    const updatedPerformanceAnalytics = await PerformanceAnalytics.findOneAndUpdate(
      { userId },
      { $push: { data: newPerformanceData } },
      { new: true, upsert: true }
    );

    res.json(updatedPerformanceAnalytics.data);
  } catch (error) {
    console.error('Error in updatePerformanceData:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const calculateDailyReturn = (totalValue: number, assets: any[], priceData: any): number => {
  // Implement daily return calculation logic here
  // This is a placeholder implementation
  return (Math.random() - 0.5) * 2; // Returns a value between -1 and 1
};