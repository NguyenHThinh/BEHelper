import { Schema, model, Document } from 'mongoose';

export type IUser = Document & {
    username: string;
    name: string;
    email: string;
    password: string;
    refreshToken?: string;
};

const userSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
}, { timestamps: true });

export default model<IUser>('User', userSchema);