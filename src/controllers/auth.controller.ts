import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/User';

const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.ACCESS_TOKEN_KEY as string, { expiresIn: '15m' });
};

const generateRefreshToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.REFRESH_TOKEN_KEY as string, { expiresIn: '7d' });
};

export const register = async (req: Request, res: Response) => {
    try {
        let { username, name, email, password } = req.body;

        // Default username to email if not provided
        if (!username) {
            username = email;
        }

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
    } catch (error: any) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body; // Changed from username to email

        const user = await User.findOne({ username }); // Find by email
        if (!user) {
            return res.status(401).json({ message: 'Email or password is incorrect' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Username or password is incorrect' });
        }

        const accessToken = generateAccessToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());

        user.refreshToken = refreshToken;
        await user.save();

        res
            .cookie('accessToken', accessToken,
                { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
            .cookie('refreshToken', refreshToken,
                { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
            .status(200).json({ message: 'Logged in successfully', data: user });
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const logout = (res: Response) => {
    res.clearCookie('accessToken')
        .clearCookie('refreshToken')
        .status(200).json({ message: 'Logged out successfully' });
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY as string);
        const user = await User.findOne({ _id: (decoded as JwtPayload)._id });
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const accessToken = generateAccessToken(user._id.toString());
        res.cookie(process.env.ACCESS_TOKEN_KEY as string, accessToken,
            { httpOnly: true, secure: true, maxAge: 15 * 60 * 1000 })
            .status(200).json({ message: 'Token refreshed successfully' });
    } catch (error: any) {
        console.error('Refresh Token Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};