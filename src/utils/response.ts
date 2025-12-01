import { Response } from 'express';


export const sendResponse = (res: Response, status = 200, data: any = {}) => {
return res.status(status).json({ success: true, ...data });
};


export const sendError = (res: Response, status = 500, message = 'Internal Server Error') => {
return res.status(status).json({ success: false, message });
};