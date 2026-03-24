import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset {
  name: string;
  symbol: string;
  amount: number;
  value: number;
  change24h: number;
  change7d?: number;
  change30d?: number;
  image?: string;
  initialValue?: number;
  purchaseDate?: Date;
}

export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId | string;
  assets: IAsset[];
  totalValue: number;
  totalChange24h: number;
  totalChange7d: number;
  totalChange30d: number;
  totalChangeAllTime: number;
  initialInvestment: number;
  lastUpdated: Date;
  createdAt: Date;
}

const AssetSchema: Schema = new Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  amount: { type: Number, required: true },
  value: { type: Number, required: true },
  change24h: { type: Number, required: true },
  change7d: { type: Number, default: 0 },
  change30d: { type: Number, default: 0 },
  image: { type: String },
  initialValue: { type: Number },
  purchaseDate: { type: Date }
});

const PortfolioSchema: Schema = new Schema({
  userId: { type: Schema.Types.Mixed, ref: 'User', required: true },
  assets: [AssetSchema],
  totalValue: { type: Number, required: true },
  totalChange24h: { type: Number, required: true },
  totalChange7d: { type: Number, default: 0 },
  totalChange30d: { type: Number, default: 0 },
  totalChangeAllTime: { type: Number, default: 0 },
  initialInvestment: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);