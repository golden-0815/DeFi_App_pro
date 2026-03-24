import { Response } from 'express';
import { UserRequest } from '../types';
import Transaction, { ITransaction } from '../models/Transaction_model';

export const getTransactions = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = (req.query.sort as string) || '-date';
    const filter = req.query.filter as string;

    const query: any = { userId };

    if (filter && (filter === 'buy' || filter === 'sell')) {
      query.type = filter;
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      transactions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTransactions: total,
    });
  } catch (error) {
    console.error('Error in getTransactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addTransaction = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { type, asset, amount, price, status } = req.body;

    const newTransaction: ITransaction = new Transaction({
      userId,
      type,
      asset,
      amount,
      price,
      status,
      totalValue: amount * price,
    });

    await newTransaction.save();

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error in addTransaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};