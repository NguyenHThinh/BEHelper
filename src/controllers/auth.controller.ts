import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/User';

const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '15m' });
};

const generateRefreshToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: '7d' });
};

export const register = async (req: Request, res: Response) => {
    const { username, name, email, password } = req.body;

    const existingUser = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, name, email, password: hashedPassword });

    res.status(201).json({ message: 'User created successfully' });
};

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await user.save();

    res
        .cookie(process.env.JWT_ACCESS_SECRET as string, accessToken,
            { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
        .cookie(process.env.JWT_REFRESH_SECRET as string, refreshToken,
            { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
        .status(200).json({ message: 'Logged in successfully' });
};

export const logout = (res: Response) => {
    res.clearCookie(process.env.JWT_ACCESS_SECRET as string)
        .clearCookie(process.env.JWT_REFRESH_SECRET as string)
        .status(200).json({ message: 'Logged out successfully' });
};

export const refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string);
    const user = await User.findOne({ _id: (decoded as JwtPayload)._id });
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const accessToken = generateAccessToken(user._id.toString());
    res.cookie(process.env.JWT_ACCESS_SECRET as string, accessToken,
        { httpOnly: true, secure: true, maxAge: 15 * 60 * 1000 })
        .status(200).json({ message: 'Token refreshed successfully' });
};