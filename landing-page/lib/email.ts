import { Resend } from 'resend';

// Initialize Resend only if API key is available
const resendApiKey = process.env.RESEND_API_KEY;
let resend: Resend | null = null;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: SendEmailOptions) {
  if (!resend) {
    console.warn('Resend API key not configured - email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const data = await resend.emails.send({
      from: options.from || 'Optimization Platform <noreply@optimization.ai>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

/**
 * Send contact form notification
 */
export async function sendContactNotification(data: {
  name: string;
  email: string;
  company: string;
  domain: string;
  message: string;
  budget?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 20px; }
          .label { font-weight: bold; color: #0369a1; margin-bottom: 5px; }
          .value { background: white; padding: 12px; border-radius: 4px; border-left: 3px solid #0ea5e9; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New Contact Form Submission</h1>
            <p style="margin: 10px 0 0;">Optimization Platform Inquiry</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name</div>
              <div class="value">${data.name}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
            </div>
            <div class="field">
              <div class="label">Company</div>
              <div class="value">${data.company}</div>
            </div>
            <div class="field">
              <div class="label">Interested Domain</div>
              <div class="value" style="text-transform: capitalize;">${data.domain}</div>
            </div>
            ${data.budget ? `
            <div class="field">
              <div class="label">Budget</div>
              <div class="value">${data.budget}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">Message</div>
              <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          <div class="footer">
            <p>Sent from Optimization Platform Landing Page</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: process.env.CONTACT_EMAIL || 'contact@optimization.ai',
    subject: `New ${data.domain.toUpperCase()} Inquiry from ${data.name}`,
    html,
    replyTo: data.email,
  });
}

/**
 * Send auto-response to inquiry
 */
export async function sendAutoResponse(data: {
  name: string;
  email: string;
  domain: string;
}) {
  const domainInfo: Record<string, {title: string; features: string[]}> = {
    sales: {
      title: 'Sales & Marketing Automation',
      features: ['LinkedIn prospect research', 'Email deliverability validation', 'Reply classification & routing'],
    },
    product: {
      title: 'Product & Manufacturing Optimization',
      features: ['UI/UX flow optimization', 'Supply chain efficiency', 'Manufacturing process tuning'],
    },
    education: {
      title: 'Education & Learning Optimization',
      features: ['Curriculum design', 'Personalized learning paths', 'Assessment strategy'],
    },
    healthcare: {
      title: 'Healthcare & Treatment Optimization',
      features: ['Treatment protocol optimization', 'Care pathway design', 'Clinical workflow improvement'],
    },
    climate: {
      title: 'Climate & Environment Optimization',
      features: ['Carbon capture efficiency', 'Renewable energy optimization', 'Sustainable agriculture'],
    },
    governance: {
      title: 'Governance & Policy Optimization',
      features: ['Policy simulation', 'Voting system design', 'Resource allocation'],
    },
  };

  const info = domainInfo[data.domain];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          h2 { color: #0369a1; margin-top: 0; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .features li { margin: 10px 0; }
          .cta { text-align: center; margin: 30px 0; }
          .button { display: inline-block; background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Thank You for Your Interest!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.name},</p>
            
            <p>Thank you for reaching out about our <strong>${info.title}</strong> package. We're excited to help you optimize your operations with AI-powered evolutionary algorithms.</p>
            
            <h2>What's Included:</h2>
            <div class="features">
              <ul style="list-style: none; padding: 0;">
                ${info.features.map(f => `<li>✓ ${f}</li>`).join('')}
              </ul>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Our team will review your inquiry (typically within 24 hours)</li>
              <li>We'll schedule a brief discovery call to understand your needs</li>
              <li>If there's a fit, we'll design a custom optimization plan</li>
              <li>We can start a pilot program as soon as next week</li>
            </ol>
            
            <p>In the meantime, feel free to explore our case studies and documentation.</p>
            
            <div class="cta">
              <a href="https://optimization.ai/domains/${data.domain}" class="button">Learn More About ${info.title}</a>
            </div>
            
            <p>Questions? Just reply to this email.</p>
            
            <p>Best regards,<br>
            <strong>The Optimization Platform Team</strong></p>
          </div>
          <div class="footer">
            <p>Powered by evolutionary AI | 25% of revenue funds breakthrough research</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.email,
    subject: `Your ${info.title} Inquiry - Next Steps`,
    html,
  });
}
