import { Schema, model, Document } from 'mongoose';

export interface ITimetable extends Document {
    userId: Schema.Types.ObjectId;
    subject: string;
    location: string;
    startTime: Date;
    endTime: Date;
    note?: string;
}

const timetableSchema = new Schema<ITimetable>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    location: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    note: { type: String },
}, { timestamps: true });

// Index for faster queries ensures efficient retrieval by user and time range
timetableSchema.index({ userId: 1, startTime: 1, endTime: 1 });

// TTL Index: Delete documents 7 days after 'endTime'
// 7 days in seconds = 7 * 24 * 60 * 60 = 604800
timetableSchema.index({ endTime: 1 }, { expireAfterSeconds: 604800 });

export default model<ITimetable>('Timetable', timetableSchema);
