

import { NextRequest } from 'next/server';
import { JWTPayload } from '@/lib/types';
import jwt from 'jsonwebtoken';

// Verify Token For API End Point
export function verifyToken(request: NextRequest): JWTPayload | null {
    try {
        const jwtToken = request.cookies.get("jwtToken");
        const token = jwtToken?.value as string;
        if (!token) return null;
        
        const privateKey = process.env.JWT_SECRET as string;
        const userPayload = jwt.verify(token, privateKey) as JWTPayload;
        return userPayload;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

// Verify Token For Page  
export function verifyTokenForPage(token: string): JWTPayload | null {
    try {
        if (!token) return null;
        
        const privateKey = process.env.JWT_SECRET as string;
        const userPayload = jwt.verify(token, privateKey) as JWTPayload;
        if (!userPayload) return null;
        
        return userPayload;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

// دالة جديدة للحصول على معلومات المستخدم من الـ headers (للاستخدام في API)
export function getUserFromHeaders(request: NextRequest): { 
    id: number; 
    role: string; 
    isAdmin: boolean 
} | null {
    try {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        const isAdmin = request.headers.get('x-is-admin');
        
        if (!userId || !userRole) return null;
        
        return {
            id: parseInt(userId),
            role: userRole,
            isAdmin: isAdmin === 'true'
        };
    } catch (error) {
        console.error('Error getting user from headers:', error);
        return null;
    }
}