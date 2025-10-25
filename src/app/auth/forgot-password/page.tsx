"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormik } from "formik";
import { forgotPasswordValidationSchema } from "@/lib/validations";
import { Card } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { client } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: forgotPasswordValidationSchema,
    onSubmit: (values) => {
      handleForgotPassword(values);
    },
  });

  const handleForgotPassword = async (values: { email: string }) => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);

    try {
      const response = await client.post(API_ENDPOINTS.FORGOT_PASSWORD, {
        email: values.email,
      });

      if (response.data.success) {
        showToast.success("Success", "OTP sent to email successfully.");
        // Redirect directly to reset password page
        window.location.href = `/auth/reset-password?email=${encodeURIComponent(formik.values.email)}`;
      } else {
        showToast.error("Error", response.data.message || "Failed to send reset email");
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      
      // Handle different error scenarios
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 422) {
          showToast.error("Error", "Email missing or user not found");
        } else if (status === 500) {
          showToast.error("Error", "Server error");
        } else {
          showToast.error("Error", data.message || "Failed to send reset email");
        }
      } else {
        showToast.error("Error", "Failed to send reset email");
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="grid min-h-svh lg:grid-cols-1 !py-0">
      <div className="flex flex-col gap-4 md:p-5">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm border p-[25px] rounded-lg">
            <div className="flex justify-center gap-2 md:justify-center mb-5">
              <Link href="/" className="flex items-center gap-2 font-medium">
                <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <span className="text-sm font-bold">B</span>
                </div>
                Bibble App
              </Link>
            </div>
            <form
              className="flex flex-col gap-6"
              onSubmit={formik.handleSubmit}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Forgot your password?</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    name="email"
                    error={formik.touched.email && formik.errors.email}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-pulse rounded-full h-4 w-4 bg-white/70" />
                      Sending...
                    </div>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </div>
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ForgotPassword;
