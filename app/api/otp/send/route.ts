import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
    const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_ID;

    if (!accountSid || !authToken || !serviceSid) {
      console.error('Twilio credentials not configured');
      return NextResponse.json(
        { error: 'Twilio service not configured' },
        { status: 500 }
      );
    }

    const credentials = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': phoneNumber,
        'Channel': 'sms'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`OTP sent successfully to ${phoneNumber}, SID: ${data.sid}`);
      return NextResponse.json({
        success: true,
        sessionId: data.sid,
        message: 'OTP sent successfully'
      });
    } else {
      console.error('Twilio API error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to send OTP' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
