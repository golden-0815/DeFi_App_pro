import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId | string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  totalValue: number;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: Schema.Types.Mixed, ref: 'User', required: true },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  asset: { type: String, required: true },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['completed', 'pending', 'failed'], required: true },
  totalValue: { type: Number, required: true },
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);