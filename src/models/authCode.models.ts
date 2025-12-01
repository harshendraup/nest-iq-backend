import { Schema, model, Document } from 'mongoose';

export interface IAuthCode extends Document {
  target: string; // email
  code: string;
  type: 'email_code';
  createdAt: Date;
  expiresAt: Date;
  attempts?: number;
}

const AuthCodeSchema = new Schema<IAuthCode>({
  target: { type: String, required: true, index: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['email_code','mobile_code'], required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 }
});

// TTL index — Mongo will remove doc after expiresAt
AuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<IAuthCode>('AuthCode', AuthCodeSchema);
