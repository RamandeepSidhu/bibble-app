"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormik } from "formik";
import { loginValidationSchema } from "@/lib/validations";
import { Card } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginValidationSchema,
    onSubmit: (values) => {
      handleLogin(values);
    },
  });

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

    const handleLogin = async (values: { email: string; password: string }) => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);

    try {
      const response: any = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (response?.ok) {
        showToast.success("Success", "User logged in successfully.");
        window.location.reload();
      } else {
        // Handle NextAuth errors
        if (response?.error) {
          let errorMsg = "Login failed";
          
          if (response.error === "CredentialsSignin") {
            errorMsg = "Invalid email or password.";
          } else {
            errorMsg = response.error;
          }
          
          showToast.error("Error", errorMsg);
        } else {
          showToast.error("Error", "Login failed");
        }
      }
    } catch (error: any) {
      showToast.error("Error", "Login failed");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Card className="grid min-h-svh lg:grid-cols-1">
      <div className="flex flex-col gap-4 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link
            href="/"
            className="flex items-center gap-2 font-medium"
          >
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">B</span>
            </div>
            Bibble App
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm border p-[25px] rounded-lg">
            <form
              className="flex flex-col gap-6"
              onSubmit={formik.handleSubmit}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Login to your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Enter your email below to login to your account
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
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="**********"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      name="password"
                      error={formik.touched.password && formik.errors.password}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                      Loading...
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Login;
