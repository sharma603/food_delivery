import nodemailer from 'nodemailer';

// Email templates
const emailTemplates = {
  'restaurant-credentials': (data) => ({
    subject: `Your Restaurant Account Credentials - ${data.restaurantName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to FoodHub, ${data.ownerName}!</h2>
        <p>Your restaurant account has been created successfully. Here are your login credentials:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Login Details:</h3>
          <p><strong>Restaurant:</strong> ${data.restaurantName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Password:</strong> ${data.password}</p>
          <p><strong>Login URL:</strong> <a href="${data.loginUrl}">${data.loginUrl}</a></p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        
        <p>Best regards,<br>The FoodHub Team</p>
      </div>
    `,
    text: `
      Welcome to FoodHub, ${data.ownerName}!
      
      Your restaurant account has been created successfully.
      
      Login Details:
      Restaurant: ${data.restaurantName}
      Email: ${data.email}
      Password: ${data.password}
      Login URL: ${data.loginUrl}
      
      Important: Please change your password after your first login for security purposes.
      
      Best regards,
      The FoodHub Team
    `
  }),

  'restaurant-new-credentials': (data) => ({
    subject: `New Login Credentials - ${data.restaurantName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Login Credentials for ${data.restaurantName}</h2>
        <p>Hello ${data.ownerName},</p>
        <p>Your login credentials have been updated. Here are your new credentials:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>New Login Details:</h3>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>New Password:</strong> ${data.password}</p>
          <p><strong>Login URL:</strong> <a href="${data.loginUrl}">${data.loginUrl}</a></p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after logging in.</p>
        
        <p>Best regards,<br>The FoodHub Team</p>
      </div>
    `,
    text: `
      New Login Credentials for ${data.restaurantName}
      
      Hello ${data.ownerName},
      
      Your login credentials have been updated.
      
      New Login Details:
      Email: ${data.email}
      New Password: ${data.password}
      Login URL: ${data.loginUrl}
      
      Important: Please change your password after logging in.
      
      Best regards,
      The FoodHub Team
    `
  })
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEmail = async (options) => {
  try {
    // For development, just log the email instead of sending
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
      console.log('=== EMAIL (Development Mode) ===');
      console.log('To:', options.to || options.email);
      console.log('Subject:', options.subject || (options.template ? emailTemplates[options.template]?.(options.data)?.subject : 'No Subject'));
      console.log('Template:', options.template || 'Custom');
      if (options.data) {
        console.log('Data:', JSON.stringify(options.data, null, 2));
      }
      console.log('===============================');
      return { messageId: 'dev-' + Date.now() };
    }

    const transporter = createTransporter();

    let mailContent;
    
    if (options.template && emailTemplates[options.template]) {
      // Use template
      mailContent = emailTemplates[options.template](options.data);
    } else {
      // Use provided content
      mailContent = {
        subject: options.subject,
        html: options.html || options.message,
        text: options.text || options.message
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'FoodHub <noreply@foodhub.com>',
      to: options.to || options.email,
      subject: mailContent.subject,
      html: mailContent.html,
      text: mailContent.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    // In development, don't throw error to avoid breaking the flow
    if (process.env.NODE_ENV === 'development') {
      console.log('Email error ignored in development mode');
      return { messageId: 'dev-error-' + Date.now() };
    }
    throw error;
  }
};

export { sendEmail };