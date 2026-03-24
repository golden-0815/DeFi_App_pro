import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceFeed extends Document {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
}

const PriceFeedSchema: Schema = new Schema({
  symbol: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  change24h: { type: Number, required: true },
  volume24h: { type: Number, required: true },
  marketCap: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model<IPriceFeed>('PriceFeed', PriceFeedSchema);