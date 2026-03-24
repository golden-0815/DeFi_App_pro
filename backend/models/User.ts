import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  address: string;
  password: string;
  accountType: 'personal' | 'demo';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  address: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accountType: { type: String, enum: ['personal', 'demo'], default: 'personal' },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);