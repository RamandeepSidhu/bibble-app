import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_ENDPOINTS } from '@/api/endpoints';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 422 }
      );
    }

    // Call the backend API
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}${API_ENDPOINTS.FORGOT_PASSWORD}`,
      { email },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Return the response from the backend
    return NextResponse.json(response.data, { status: response.status });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    
    // Handle different error scenarios
    if (error.response) {
      // Backend returned an error response
      const { status, data } = error.response;
      
      if (status === 422) {
        return NextResponse.json(
          { message: 'Email missing or user not found' },
          { status: 422 }
        );
      }
      
      if (status === 500) {
        return NextResponse.json(
          { message: 'Server error' },
          { status: 500 }
        );
      }
      
      // Return the backend error message
      return NextResponse.json(
        { message: data.message || 'Failed to send reset email' },
        { status: status }
      );
    }
    
    // Network or other errors
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
