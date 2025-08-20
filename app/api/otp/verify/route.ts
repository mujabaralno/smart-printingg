import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
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

    const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': phoneNumber,
        'Code': otp
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`OTP verification result for ${phoneNumber}:`, data);
      
      if (data.status === 'approved') {
        return NextResponse.json({
          success: true,
          message: 'OTP verified successfully'
        });
      } else {
        return NextResponse.json(
          { error: `OTP verification failed: ${data.status}` },
          { status: 400 }
        );
      }
    } else {
      console.error('Twilio verification error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to verify OTP' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
