class EmailTemplates {
  static generateCredentialsTemplate(options) {
    const {
      firstName,
      username,
      email,
      password,
      transactionPin,
      actionType, // 'created' or 'reset'
      customMessage = null,
    } = options;

    const formattedFirstName = this.formatName(firstName);

    const actionText =
      actionType === "reset"
        ? "Your account credentials have been reset"
        : "Your account has been successfully created";

    const actionDescription =
      actionType === "reset"
        ? "Your credentials have been reset as requested. Here are your new login credentials:"
        : "Your account has been successfully created. Here are your login credentials:";

    const subject =
      actionType === "reset"
        ? "Your Credentials Have Been Reset"
        : "Your Account Credentials";

    const dynamicMessage =
      customMessage ||
      `
      <p>${actionDescription}</p>
    `;

    return {
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Credentials</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f5f5f5;
                    margin: 0;
                    padding: 0;
                }
                
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                }
                
                .header {
                    background: linear-gradient(135deg, #4F46E5, #7E69E5);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                
                .header h1 {
                    font-size: 28px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                
                .header p {
                    font-size: 16px;
                    opacity: 0.9;
                }
                
                .content {
                    padding: 30px;
                    background: #ffffff;
                }
                
                .greeting {
                    font-size: 18px;
                    margin-bottom: 20px;
                    color: #333;
                }
                
                .action-alert {
                    background: #e8f4fd;
                    border-left: 4px solid #4F46E5;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                
                .action-alert h3 {
                    color: #4F46E5;
                    margin-bottom: 8px;
                    font-size: 18px;
                }
                
                .credentials-card {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border: 1px solid #e9ecef;
                }
                
                .credentials-card h3 {
                    color: #495057;
                    margin-bottom: 15px;
                    font-size: 18px;
                    border-bottom: 2px solid #4F46E5;
                    padding-bottom: 8px;
                }
                
                .credential-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #dee2e6;
                }
                
                .credential-item:last-child {
                    border-bottom: none;
                }
                
                .credential-label {
                    font-weight: 600;
                    color: #495057;
                }
                
                .credential-value {
                    color: #212529;
                    font-family: 'Courier New', monospace;
                    background: #ffffff;
                    padding: 4px 8px;
                    border-radius: 4px;
                    border: 1px solid #dee2e6;
                }
                
                .security-notice {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                }
                
                .security-notice h4 {
                    color: #856404;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                
                .security-notice ul {
                    margin-left: 20px;
                    color: #856404;
                }
                
                .security-notice li {
                    margin-bottom: 5px;
                }
                
                .instructions {
                    background: #d1ecf1;
                    border: 1px solid #bee5eb;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                    color: #0c5460;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    color: #6c757d;
                    font-size: 14px;
                }
                
                .support-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                    text-align: center;
                }
                
                @media (max-width: 600px) {
                    .content {
                        padding: 20px;
                    }
                    
                    .header {
                        padding: 20px 15px;
                    }
                    
                    .header h1 {
                        font-size: 24px;
                    }
                    
                    .credential-item {
                        flex-direction: column;
                        gap: 5px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Account ${actionType === "reset" ? "Credentials Reset" : "Created Successfully"}</h1>
                    <p>${actionType === "reset" ? "Your credentials have been updated" : "Welcome to our platform"}</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello <strong>${formattedFirstName}</strong>,
                    </div>
                    
                    <div class="action-alert">
                        <h3>${actionText}</h3>
                        ${dynamicMessage}
                    </div>
                    
                    <div class="credentials-card">
                        <h3>Your Account Credentials</h3>
                        <div class="credential-item">
                            <span class="credential-label">Username:</span>
                            <span class="credential-value">${username}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Email:</span>
                            <span class="credential-value">${email}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Password:</span>
                            <span class="credential-value">${password}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Transaction PIN:</span>
                            <span class="credential-value">${transactionPin}</span>
                        </div>
                    </div>
                    
                    <div class="security-notice">
                        <h4>🔒 Important Security Notice</h4>
                        <ul>
                            <li>Keep your credentials secure and confidential</li>
                            <li>Change your password after first login</li>
                            <li>Never share your Transaction PIN with anyone</li>
                            <li>These credentials are for your use only</li>
                            ${actionType === "reset" ? "<li>All previous sessions have been invalidated</li>" : ""}
                        </ul>
                    </div>
                    
                    ${
                      actionType === "created"
                        ? `
                    <div class="instructions">
                        <h4>📝 Next Steps</h4>
                        <p>You can now login to your account using the credentials above. We recommend updating your password after your first login for enhanced security.</p>
                    </div>
                    `
                        : ""
                    }
                    
                    <div class="support-info">
                        <p>If you have any questions or need assistance, please contact our support team.</p>
                    </div>
                    
                    <p>Best regards,<br><strong>Support Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>If you didn't request this ${actionType === "reset" ? "reset" : "account"}, please contact support immediately.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: this.generateCredentialsPlainText(options),
    };
  }

  static generateCredentialsPlainText(options) {
    const {
      firstName,
      username,
      email,
      password,
      transactionPin,
      actionType,
      customMessage = null,
    } = options;

    const formattedFirstName = this.formatName(firstName);

    const actionText =
      actionType === "reset"
        ? "Your account credentials have been reset"
        : "Your account has been successfully created";

    const actionDescription =
      actionType === "reset"
        ? "Your credentials have been reset as requested. Here are your new login credentials:"
        : "Your account has been successfully created. Here are your login credentials:";

    const dynamicMessage = customMessage || actionDescription;

    return `
${actionText}

Hello ${formattedFirstName},

${dynamicMessage}

YOUR ACCOUNT CREDENTIALS:
─────────────────────────
Username: ${username}
Email: ${email}
Password: ${password}
Transaction PIN: ${transactionPin}

IMPORTANT SECURITY NOTICE:
──────────────────────────
• Keep your credentials secure and confidential
• Change your password after first login
• Never share your Transaction PIN with anyone
• These credentials are for your use only
${actionType === "reset" ? "• All previous sessions have been invalidated" : ""}

${
  actionType === "created"
    ? `
NEXT STEPS:
───────────
You can now login to your account using the credentials above. We recommend updating your password after your first login for enhanced security.
`
    : ""
}

If you have any questions or need assistance, please contact our support team.

Best regards,
Support Team

──────────────────────────
This is an automated message. Please do not reply to this email.
If you didn't request this ${actionType === "reset" ? "reset" : "account"}, please contact support immediately.
    `.trim();
  }

  static generatePasswordResetTemplate(options) {
    const {
      firstName,
      resetUrl,
      expiryMinutes = 2,
      supportEmail = null,
      customMessage = null,
    } = options;

    const formattedFirstName = this.formatName(firstName);
    const expiryTime = `${expiryMinutes} minute${expiryMinutes !== 1 ? "s" : ""}`;

    return {
      subject: "Password Reset Instructions",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f5f5f5;
                    margin: 0;
                    padding: 0;
                }
                
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                }
                
                .header {
                    background: linear-gradient(135deg, #4F46E5, #7E69E5);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                
                .header h1 {
                    font-size: 28px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                
                .header p {
                    font-size: 16px;
                    opacity: 0.9;
                }
                
                .content {
                    padding: 30px;
                    background: #ffffff;
                }
                
                .greeting {
                    font-size: 18px;
                    margin-bottom: 20px;
                    color: #333;
                }
                
                .instruction-box {
                    background: #e8f4fd;
                    border-left: 4px solid #4F46E5;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                
                .instruction-box h3 {
                    color: #4F46E5;
                    margin-bottom: 10px;
                    font-size: 18px;
                }
                
                .reset-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #4F46E5, #7E69E5);
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 15px 0;
                    text-align: center;
                    transition: all 0.3s ease;
                }
                
                .reset-button:hover {
                    background: linear-gradient(135deg, #4338CA, #6D5BD5);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                }
                
                .url-backup {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 15px 0;
                    word-break: break-all;
                    font-size: 14px;
                    border: 1px solid #e9ecef;
                }
                
                .url-backup a {
                    color: #4F46E5;
                    text-decoration: none;
                }
                
                .security-notice {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                }
                
                .security-notice h4 {
                    color: #856404;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                
                .security-notice ul {
                    margin-left: 20px;
                    color: #856404;
                }
                
                .security-notice li {
                    margin-bottom: 5px;
                }
                
                .expiry-warning {
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                    color: #721c24;
                }
                
                .expiry-warning h4 {
                    margin-bottom: 8px;
                    font-size: 16px;
                }
                
                .support-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                    text-align: center;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    color: #6c757d;
                    font-size: 14px;
                }
                
                @media (max-width: 600px) {
                    .content {
                        padding: 20px;
                    }
                    
                    .header {
                        padding: 20px 15px;
                    }
                    
                    .header h1 {
                        font-size: 24px;
                    }
                    
                    .reset-button {
                        display: block;
                        margin: 15px auto;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                    <p>Secure your account with a new password</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello <strong>${formattedFirstName}</strong>,
                    </div>
                    
                    <div class="instruction-box">
                        <h3>Reset Your Password</h3>
                        ${
                          customMessage ||
                          `
                        <p>We received a request to reset your password. Click the button below to create a new secure password for your account.</p>
                        `
                        }
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="reset-button" target="_blank" rel="noopener noreferrer">
                            Reset Your Password
                        </a>
                    </div>
                    
                    <div class="url-backup">
                        <p><strong>Alternative:</strong> If the button doesn't work, copy and paste this URL into your browser:</p>
                        <a href="${resetUrl}">${resetUrl}</a>
                    </div>
                    
                    <div class="expiry-warning">
                        <h4>⏰ Important Time Limit</h4>
                        <p>This password reset link will expire in <strong>${expiryTime}</strong>. For security reasons, please reset your password immediately.</p>
                    </div>
                    
                    <div class="security-notice">
                        <h4>🔒 Security Tips</h4>
                        <ul>
                            <li>Never share your password reset link with anyone</li>
                            <li>Create a strong, unique password you haven't used before</li>
                            <li>Ensure your new password is at least 8 characters long with mix of letters, numbers, and symbols</li>
                            <li>If you didn't request this reset, contact support immediately</li>
                        </ul>
                    </div>
                    
                    <div class="support-info">
                        <p>If you need help or have questions, our support team is here for you.</p>
                        ${supportEmail ? `<p>Contact us at: <a href="mailto:${supportEmail}">${supportEmail}</a></p>` : ""}
                    </div>
                    
                    <p>Best regards,<br><strong>Security Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>This is an automated security message. Please do not reply to this email.</p>
                    <p>If you didn't request a password reset, please secure your account immediately.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: this.generatePasswordResetPlainText(options),
    };
  }

  static generatePasswordResetPlainText(options) {
    const {
      firstName,
      resetUrl,
      expiryMinutes = 2,
      supportEmail = null,
      customMessage = null,
    } = options;

    const formattedFirstName = this.formatName(firstName);
    const expiryTime = `${expiryMinutes} minute${expiryMinutes !== 1 ? "s" : ""}`;

    return `
Password Reset Instructions

Hello ${formattedFirstName},

${customMessage || "We received a request to reset your password. Use the link below to create a new secure password for your account."}

RESET YOUR PASSWORD:
───────────────────
${resetUrl}

IMPORTANT TIME LIMIT:
─────────────────────
This password reset link will expire in ${expiryTime}. For security reasons, please reset your password immediately.

SECURITY TIPS:
──────────────
• Never share your password reset link with anyone
• Create a strong, unique password you haven't used before
• Ensure your new password is at least 8 characters long with mix of letters, numbers, and symbols
• If you didn't request this reset, contact support immediately

${supportEmail ? `If you need help, contact our support team at: ${supportEmail}\n` : ""}

Best regards,
Security Team

──────────────────────────
This is an automated security message. Please do not reply to this email.
If you didn't request a password reset, please secure your account immediately.
    `.trim();
  }

  static formatName(name) {
    if (!name) return name;
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();
  }
}

export default EmailTemplates;
