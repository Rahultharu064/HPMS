import prisma from "../config/client.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createTransporter } from "./services/emailService.js";

export const listFrontOfficeStaff = async (req, res) => {
  try {
    const { q } = req.query || {}
    const where = q ? { name: { contains: String(q), mode: 'insensitive' } } : {}
    const data = await prisma.frontOfficeStaff.findMany({ where, orderBy: { name: 'asc' } })
    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to list front office staff' })
  }
}

export const getFrontOfficeStaff = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const staff = await prisma.frontOfficeStaff.findUnique({ where: { id } })
    if (!staff) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: staff })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to fetch front office staff' })
  }
}

export const createFrontOfficeStaff = async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.name) return res.status(400).json({ success: false, error: 'name required' })
    if (!body.email) return res.status(400).json({ success: false, error: 'email required' })

    // Generate a temporary password
    const tempPassword = `FO${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    const staff = await prisma.frontOfficeStaff.create({
      data: {
        name: String(body.name),
        email: String(body.email),
        password: hashedPassword,
        role: 'front_office',
        shift: body.shift ? String(body.shift) : 'MORNING',
        isActive: true,
        passwordChanged: false,
        updatedAt: new Date(),
      }
    })

    // Send email with temporary password
    try {
      const transporter = createTransporter();
      if (transporter) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: body.email,
          subject: 'Welcome to Hotel Front Office Team - Your Account Details',
          text: `Welcome to the front office team!

Dear ${body.name},

Your account has been created successfully.

Your temporary password is: ${tempPassword}

⚠️ Please change your password after your first login for security purposes.

You can now log in to the front office system using your email and this temporary password.

If you have any questions, please contact the administration team.

Best regards,
Hotel Management Team`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Front office staff account created and email sent to ${body.email}`);
      } else {
        console.warn('Email transporter not configured, skipping welcome email');
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the creation if email fails
    }

    res.status(201).json({
      success: true,
      data: staff,
      tempPassword: tempPassword,
      message: 'Front office staff created successfully. Temporary password sent to email.'
    })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Email already exists' })
    }
    res.status(500).json({ success: false, error: 'Failed to create front office staff' })
  }
}

export const updateFrontOfficeStaff = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const body = req.body || {}
    const data = {
      ...(body.name !== undefined && { name: String(body.name) }),
      ...(body.email !== undefined && { email: String(body.email) }),
      ...(body.password !== undefined && { password: await bcrypt.hash(body.password, 10) }),
      ...(body.shift !== undefined && { shift: body.shift ? String(body.shift) : 'MORNING' }),
      ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      updatedAt: new Date(),
    }
    const staff = await prisma.frontOfficeStaff.update({ where: { id }, data })
    res.json({ success: true, data: staff })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Not found' })
    if (err.code === 'P2002') return res.status(400).json({ success: false, error: 'Email already exists' })
    res.status(500).json({ success: false, error: 'Failed to update front office staff' })
  }
}

export const deleteFrontOfficeStaff = async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.frontOfficeStaff.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Not found' })
    res.status(500).json({ success: false, error: 'Failed to delete front office staff' })
  }
}

export const resetFrontOfficeStaffPassword = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const body = req.body || {}
    if (!body.newPassword) return res.status(400).json({ success: false, error: 'newPassword required' })

    const hashedPassword = await bcrypt.hash(body.newPassword, 10)
    const staff = await prisma.frontOfficeStaff.update({
      where: { id },
      data: { password: hashedPassword, passwordChanged: true, updatedAt: new Date() }
    })

    // Send password change confirmation email
    try {
      const transporter = createTransporter();
      if (transporter) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: staff.email,
          subject: 'Password Changed - Hotel Front Office System',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Password Changed</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .success-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50; }
                .warning { color: #d32f2f; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Password Updated</h1>
                </div>
                <div class="content">
                  <p>Dear ${staff.name},</p>
                  <p>Your password has been successfully updated.</p>

                  <div class="success-box">
                    <p><strong>✅ Password Change Confirmed</strong></p>
                    <p>If you did not request this change, please contact the administration team immediately.</p>
                  </div>

                  <p>You can now log in to the front office system with your new password.</p>

                  <p>If you have any questions, please contact the administration team.</p>

                  <p>Best regards,<br>Hotel Management Team</p>
                </div>
                <div class="footer">
                  <p>This is an automated message. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password reset confirmation email sent to ${staff.email}`);
      } else {
        console.warn('Email transporter not configured, skipping confirmation email');
      }
    } catch (emailError) {
      console.error('Failed to send password reset confirmation email:', emailError);
      // Don't fail the password reset if email fails
    }

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Not found' })
    res.status(500).json({ success: false, error: 'Failed to reset password' })
  }
}
