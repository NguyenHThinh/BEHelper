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

        res.status(201).json({ message: 'User created successfully', success: true });
    } catch (error: any) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const token = req.cookies['accessToken'];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY as string) as JwtPayload;
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ success: true, data: { email: user.email, name: user.name } });
    } catch (error: any) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
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
            .cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000
            })
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            .status(200)
            .json({
                success: true,
                message: 'Logged in successfully',
                data: {
                    email: user.email,
                    name: user.name
                }
            });
    } catch (error: any) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const logout = (_: Request, res: Response) => {
    res
        .clearCookie('accessToken')
        .clearCookie('refreshToken')
        .status(200)
        .json({ success: true });
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies['refreshToken'];

        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
        const user = await User.findOne({ _id: decoded.userId });

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const accessToken = generateAccessToken(user._id.toString());

        res
            .cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000
            })
            .status(200)
            .json({ message: 'Token refreshed successfully' });
    } catch (error: any) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};