import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
    service: process.env.MALI_SERVICE,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});
export const sendCode = async (email: string, code: number) => {
    return transport.sendMail(
        {
            from: "ShareEm <mikiyaslemlemu@gmail.com>",
            to: email,
            subject: "Verification Code [ShareEm]",
            text: `Your verification code is ${code}`,
        }
    )
}