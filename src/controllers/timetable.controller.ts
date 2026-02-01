import { Request, Response } from 'express';
import Timetable from '../models/Timetable';

export const createEntry = async (req: Request, res: Response) => {
    try {
        const { subject, location, startTime, endTime, note } = req.body;
        const userId = (req as any).userId;

        if (!subject || !location || !startTime || !endTime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        // Validate date range: +/- 7 days
        const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
        const minDate = new Date(now.getTime() - sevenDaysInMillis);
        const maxDate = new Date(now.getTime() + sevenDaysInMillis);

        if (start < minDate || start > maxDate) {
            return res.status(400).json({
                message: 'Start time must be within 7 days from today (past or future).'
            });
        }

        if (end <= start) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        const newEntry = await Timetable.create({
            userId,
            subject,
            location,
            startTime: start,
            endTime: end,
            note
        });

        res.status(201).json({ message: 'Timetable entry created', data: newEntry });
    } catch (error: any) {
        console.error('Create Timetable Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getEntries = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { start, end } = req.query;

        let query: any = { userId };

        if (start && end) {
            query.startTime = {
                $gte: new Date(start as string),
                $lte: new Date(end as string)
            };
        }

        // Sort by start time ascending
        const entries = await Timetable.find(query).sort({ startTime: 1 });

        res.status(200).json({ data: entries });
    } catch (error: any) {
        console.error('Get Timetable Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const deleteEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const deleted = await Timetable.findOneAndDelete({ _id: id, userId });

        if (!deleted) {
            return res.status(404).json({ message: 'Entry not found or unauthorized' });
        }

        res.status(200).json({ message: 'Entry deleted successfully' });
    } catch (error: any) {
        console.error('Delete Timetable Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const updateEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;
        const { subject, location, startTime, endTime, note } = req.body;

        if (!subject || !location || !startTime || !endTime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        const updatedEntry = await Timetable.findOneAndUpdate(
            { _id: id, userId },
            {
                subject,
                location,
                startTime: start,
                endTime: end,
                note
            },
            { new: true }
        );

        if (!updatedEntry) {
            return res.status(404).json({ message: 'Entry not found or unauthorized' });
        }

        res.status(200).json({ message: 'Timetable entry updated', data: updatedEntry });
    } catch (error: any) {
        console.error('Update Timetable Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
