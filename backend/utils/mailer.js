const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetEmail = async (to, resetUrl) => {
    const { error } = await resend.emails.send({
        from: 'StreamVibe <onboarding@resend.dev>',
        to,
        subject: 'Reset your StreamVibe password',
        html: `
            <p>You requested a password reset for your StreamVibe account.</p>
            <p><a href="${resetUrl}">Click here to choose a new password</a></p>
            <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
        `,
    });

    if (error) throw new Error(error.message || 'Failed to send email');
};

module.exports = { sendPasswordResetEmail };
