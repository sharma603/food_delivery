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


  'password-reset-otp': (data) => ({
    subject: `Password Reset OTP - FoodHub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset OTP</h2>
        <p>Hello ${data.name || 'User'},</p>
        <p>You have requested to reset your password. Use the OTP below to verify your identity:</p>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center; position: relative; border: 2px solid #007bff;">
          <div style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; border-radius: 8px; margin-bottom: 15px;">
            <h1 id="otp-code" style="font-size: 48px; color: white; margin: 0; letter-spacing: 8px; user-select: all; -webkit-user-select: all; -moz-user-select: all; -ms-user-select: all;">${data.otp}</h1>
          </div>
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <p style="margin: 0; color: #1976d2; font-size: 14px; font-weight: bold;">📋 Tap and hold to copy this code</p>
          </div>
          <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">Or select the code above and copy it manually</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>⚠️ Important Security Information:</h4>
          <ul>
            <li>This OTP will expire in 5 minutes</li>
            <li>You have 3 attempts to enter the correct OTP</li>
            <li>If you didn't request this password reset, please ignore this email</li>
            <li>Never share this OTP with anyone</li>
          </ul>
        </div>
        
        <p>After entering the correct OTP, you will be able to set a new password for your account.</p>
        
        <p>Best regards,<br>The FoodHub Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This email was sent to ${data.email}. If you have any questions, please contact our support team.
        </p>
      </div>
    `,
    text: `
      Password Reset OTP - FoodHub
      
      Hello ${data.name || 'User'},
      
      You have requested to reset your password. Use the OTP below to verify your identity:
      
      OTP: ${data.otp}
      
      Important Security Information:
      - This OTP will expire in 5 minutes
      - You have 3 attempts to enter the correct OTP
      - If you didn't request this password reset, please ignore this email
      - Never share this OTP with anyone
      
      After entering the correct OTP, you will be able to set a new password for your account.
      
      Best regards,
      The FoodHub Team
      
      This email was sent to ${data.email}. If you have any questions, please contact our support team.
    `
  }),

  'order-confirmation': (data) => ({
    subject: `Order Confirmation #${data.orderNumber} - FoodHub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Order Confirmed!</h2>
        <p>Hello ${data.customerName || 'Customer'},</p>
        <p>Thank you for your order! We've received your order and will prepare it right away.</p>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #28a745;">Order Details</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Restaurant:</strong> ${data.restaurantName}</p>
          <p><strong>Order Date:</strong> ${data.orderDate}</p>
          <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Items</h3>
          ${data.items.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
              <div>
                <strong>${item.name}</strong> x ${item.quantity}
                ${item.customizations && item.customizations.length > 0 ? `
                  <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    ${item.customizations.map(c => `${c.name}: ${c.value}`).join(', ')}
                  </div>
                ` : ''}
              </div>
              <div style="text-align: right;">
                <strong>Rs ${item.subtotal.toFixed(2)}</strong>
                <div style="font-size: 12px; color: #666;">Rs ${item.price.toFixed(2)} each</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="background-color: white; padding: 20px; border: 2px solid #dee2e6; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Price Breakdown</h3>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>Subtotal:</span>
            <strong>Rs ${data.pricing.subtotal.toFixed(2)}</strong>
          </div>
          ${data.pricing.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #28a745;">
              <span>Discount:</span>
              <strong>- Rs ${data.pricing.discount.toFixed(2)}</strong>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>Delivery Fee:</span>
            <strong>Rs ${data.pricing.deliveryFee.toFixed(2)}</strong>
          </div>
          ${data.pricing.tax > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span>Tax:</span>
              <strong>Rs ${data.pricing.tax.toFixed(2)}</strong>
            </div>
          ` : ''}
          <hr style="margin: 15px 0; border: none; border-top: 2px solid #dee2e6;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 18px; font-weight: bold; color: #28a745;">
            <span>Total Amount:</span>
            <span>Rs ${data.pricing.total.toFixed(2)}</span>
          </div>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0;">💳 Payment Method</h4>
          <p style="font-size: 18px; font-weight: bold; margin: 0;">${data.paymentMethod === 'cash_on_delivery' ? '💰 Cash on Delivery' : '💳 Online Payment (Paid)'}</p>
        </div>

        ${data.deliveryAddress ? `
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">📍 Delivery Address</h4>
            <p style="margin: 5px 0;">
              ${data.deliveryAddress.street || ''}
              ${data.deliveryAddress.city ? `<br>${data.deliveryAddress.city}` : ''}
              ${data.deliveryAddress.state ? `, ${data.deliveryAddress.state}` : ''}
              ${data.deliveryAddress.zipCode ? ` ${data.deliveryAddress.zipCode}` : ''}
            </p>
          </div>
        ` : ''}

        ${data.specialInstructions ? `
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">📝 Special Instructions</h4>
            <p style="margin: 0;">${data.specialInstructions}</p>
          </div>
        ` : ''}

        <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #155724;">📦 What's Next?</h4>
          <ul style="margin: 0;">
            <li>We're preparing your order</li>
            <li>You'll receive updates on your order status</li>
            <li>Estimated delivery time: ${data.estimatedDelivery}</li>
            <li>Track your order in the app</li>
          </ul>
        </div>
        
        <p>Best regards,<br><strong>The FoodHub Team</strong></p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This email was sent to ${data.customerEmail}. If you have any questions about your order, please contact our support team.
        </p>
      </div>
    `,
    text: `
      Order Confirmation #${data.orderNumber} - FoodHub
      
      Hello ${data.customerName || 'Customer'},
      
      Thank you for your order! We've received your order and will prepare it right away.
      
      Order Details:
      Order Number: ${data.orderNumber}
      Restaurant: ${data.restaurantName}
      Order Date: ${data.orderDate}
      Estimated Delivery: ${data.estimatedDelivery}
      
      Order Items:
      ${data.items.map(item => `  ${item.name} x ${item.quantity} - Rs ${item.subtotal.toFixed(2)}`).join('\n')}
      
      Price Breakdown:
      Subtotal: Rs ${data.pricing.subtotal.toFixed(2)}
      ${data.pricing.discount > 0 ? `Discount: - Rs ${data.pricing.discount.toFixed(2)}` : ''}
      Delivery Fee: Rs ${data.pricing.deliveryFee.toFixed(2)}
      ${data.pricing.tax > 0 ? `Tax: Rs ${data.pricing.tax.toFixed(2)}` : ''}
      Total Amount: Rs ${data.pricing.total.toFixed(2)}
      
      Payment Method: ${data.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}
      
      ${data.deliveryAddress ? `\nDelivery Address:\n${data.deliveryAddress.street || ''}${data.deliveryAddress.city ? '\n' + data.deliveryAddress.city : ''}${data.deliveryAddress.state ? ', ' + data.deliveryAddress.state : ''}${data.deliveryAddress.zipCode ? ' ' + data.deliveryAddress.zipCode : ''}\n` : ''}
      ${data.specialInstructions ? `\nSpecial Instructions:\n${data.specialInstructions}\n` : ''}
      
      What's Next?
      - We're preparing your order
      - You'll receive updates on your order status
      - Estimated delivery time: ${data.estimatedDelivery}
      - Track your order in the app
      
      Best regards,
      The FoodHub Team
      
      This email was sent to ${data.customerEmail}. If you have any questions about your order, please contact our support team.
    `
  }),

  'password-reset-success': (data) => ({
    subject: `Password Reset Successful - FoodHub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Successful</h2>
        <p>Hello ${data.name || 'User'},</p>
        <p>Your password has been successfully reset for your FoodHub account.</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>✅ Password Updated Successfully</h3>
          <p>Your account is now secure with your new password.</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>🔒 Security Tips:</h4>
          <ul>
            <li>Use a strong, unique password</li>
            <li>Don't share your password with anyone</li>
            <li>Log out from shared devices</li>
            <li>Contact us if you notice any suspicious activity</li>
          </ul>
        </div>
        
        <p>If you didn't make this change, please contact our support team immediately.</p>
        
        <p>Best regards,<br>The FoodHub Team</p>
      </div>
    `,
    text: `
      Password Reset Successful - FoodHub
      
      Hello ${data.name || 'User'},
      
      Your password has been successfully reset for your FoodHub account.
      
      Your account is now secure with your new password.
      
      Security Tips:
      - Use a strong, unique password
      - Don't share your password with anyone
      - Log out from shared devices
      - Contact us if you notice any suspicious activity
      
      If you didn't make this change, please contact our support team immediately.
      
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
    console.log('📧 Email Service Debug Info:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set');
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set');
    
    // For development, just log the email instead of sending
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
      console.log('=== EMAIL (Development Mode - No SMTP configured) ===');
      console.log('To:', options.to || options.email);
      console.log('Subject:', options.subject || (options.template ? emailTemplates[options.template]?.(options.data)?.subject : 'No Subject'));
      console.log('Template:', options.template || 'Custom');
      if (options.data) {
        console.log('Data:', JSON.stringify(options.data, null, 2));
      }
      console.log('===============================');
      console.log('⚠️  To send real emails, configure EMAIL_USER and EMAIL_PASS in .env file');
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

    console.log('📤 Attempting to send email to:', mailOptions.to);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    // In development, don't throw error to avoid breaking the flow
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email error ignored in development mode');
      console.log('⚠️  To fix: Configure EMAIL_USER and EMAIL_PASS in .env file');
      return { messageId: 'dev-error-' + Date.now() };
    }
    throw error;
  }
};

export { sendEmail };