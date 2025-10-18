// Welcome Email Template
// This file structure created as per requested organization

export const welcomeTemplate = (userData) => {
  return {
    subject: `Welcome to FoodHub, ${userData.name}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to FoodHub!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2>Hello ${userData.name},</h2>
          
          <p>Welcome to FoodHub! We're excited to have you join our platform.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Account Details:</h3>
            <p><strong>Name:</strong> ${userData.name}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Account Type:</strong> ${userData.userType}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/login" 
               style="background: #667eea; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Get Started
            </a>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The FoodHub Team</p>
        </div>
        
        <div style="background: #343a40; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 12px;">
            © ${new Date().getFullYear()} FoodHub. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `
      Welcome to FoodHub!
      
      Hello ${userData.name},
      
      Welcome to FoodHub! We're excited to have you join our platform.
      
      Your account details:
      Name: ${userData.name}
      Email: ${userData.email}
      Account Type: ${userData.userType}
      
      Get started by visiting: ${process.env.CLIENT_URL}/login
      
      If you have any questions, please contact our support team.
      
      Best regards,
      The FoodHub Team
    `
  };
};

export default welcomeTemplate;
