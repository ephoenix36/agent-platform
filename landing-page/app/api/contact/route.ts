import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validations';
import { sendContactNotification, sendAutoResponse } from '@/lib/email';
import {
  checkRateLimit,
  getClientIdentifier,
  isHoneypotTriggered,
  detectSpam,
} from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Check honeypot field
    if (isHoneypotTriggered(body.website)) {
      console.warn('Honeypot triggered - likely spam');
      // Return success to not alert bot
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Rate limiting
    const clientId = getClientIdentifier(request.headers);
    const rateLimit = checkRateLimit(clientId, {
      maxRequests: 5, // 5 requests
      windowMs: 60 * 60 * 1000, // per hour
      message: 'Too many contact form submissions. Please try again in an hour.',
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: rateLimit.message,
          resetIn: Math.ceil(rateLimit.resetIn / 1000), // seconds
        },
        { status: 429 }
      );
    }

    // Validate with Zod
    const validationResult = contactFormSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Spam detection
    const spamCheck = detectSpam(data);
    if (spamCheck.isSpam) {
      console.warn('Spam detected:', spamCheck.reason);
      // Return success to not alert spammer
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Send notification email to team
    const notificationResult = await sendContactNotification(data);
    
    if (!notificationResult.success) {
      console.error('Failed to send notification:', notificationResult.error);
      // Don't fail the request - log for monitoring
    }

    // Send auto-response to user
    const autoResponseResult = await sendAutoResponse({
      name: data.name,
      email: data.email,
      domain: data.domain,
    });

    if (!autoResponseResult.success) {
      console.error('Failed to send auto-response:', autoResponseResult.error);
    }

    // TODO: Save to database or CRM (Airtable, Notion, etc.)
    // Example:
    // await saveToAirtable(data);
    // await saveToNotion(data);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Contact form submitted successfully' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
