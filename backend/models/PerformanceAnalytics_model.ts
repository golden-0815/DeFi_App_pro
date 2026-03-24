import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformanceData {
  date: Date;
  totalValue: number;
  dailyReturn: number;
  assets: {
    [symbol: string]: {
      value: number;
      amount: number;
    };
  };
}

export interface IPerformanceAnalytics extends Document {
  userId: mongoose.Types.ObjectId | string;
  data: IPerformanceData[];
}

const PerformanceAnalyticsSchema: Schema = new Schema({
  userId: { type: Schema.Types.Mixed, ref: 'User', required: true },
  data: [{
    date: { type: Date, required: true },
    totalValue: { type: Number, required: true },
    dailyReturn: { type: Number, required: true },
    assets: { type: Map, of: new Schema({
      value: { type: Number, required: true },
      amount: { type: Number, required: true },
    })},
  }],
});

export default mongoose.model<IPerformanceAnalytics>('PerformanceAnalytics', PerformanceAnalyticsSchema);