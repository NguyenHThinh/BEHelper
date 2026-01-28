import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies[process.env.JWT_ACCESS_SECRET as string];

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;
        (req as any).userId = decoded.userId;

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
