"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormik } from "formik";
import { resetPasswordValidationSchema } from "@/lib/validations";
import { Card } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { client } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const formik = useFormik({
    initialValues: {
      email: email,
      otp: "",
      newPassword: "",
    },
    validationSchema: resetPasswordValidationSchema,
    onSubmit: (values) => {
      handleResetPassword(values);
    },
  });

  const handleResetPassword = async (values: { 
    email: string; 
    otp: string; 
    newPassword: string; 
  }) => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);

    try {
      const response = await client.post(API_ENDPOINTS.RESET_PASSWORD, {
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
      });

      if (response.data.success) {
        setIsSuccess(true);
        showToast.success("Success", "Password reset successfully.");
      } else {
        showToast.error("Error", response.data.message || "Failed to reset password");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      
      // Handle different error scenarios
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 422) {
          showToast.error("Error", "Invalid OTP or missing fields");
        } else if (status === 500) {
          showToast.error("Error", "Server error");
        } else {
          showToast.error("Error", data.message || "Failed to reset password");
        }
      } else {
        showToast.error("Error", "Failed to reset password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Password reset successful!</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
              </div>
              <div className="mt-6">
                <Link href="/auth/login">
                  <Button className="w-full">
                    Continue to login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

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
                <h1 className="text-2xl font-bold">Reset your password</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Enter the OTP sent to your email and create a new password
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
                    disabled={!!email}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={formik.values.otp}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    name="otp"
                    error={formik.touched.otp && formik.errors.otp}
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={formik.values.newPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      name="newPassword"
                      error={formik.touched.newPassword && formik.errors.newPassword}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-pulse rounded-full h-4 w-4 bg-white/70" />
                      Resetting...
                    </div>
                  ) : (
                    "Reset Password"
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

export default ResetPassword;
