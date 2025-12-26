"use client";

import InputGroup from "@/components/FormElements/InputGroup";
import { EmailIcon } from "@/assets/icons";
import Link from "next/link";
import { useForgotPassword } from "./useForgotPassword";

export default function ForgotPasswordPage() {
  const { email, setEmail, handleSubmit, loading, error, success } =
    useForgotPassword();

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
        Forgot Password
      </h1>

      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Enter your email and we will send a new temporary password.
      </p>

      <form onSubmit={handleSubmit}>
        <InputGroup
          type="email"
          label="Email"
          className="mb-4 [&_input]:py-[15px]"
          placeholder="Enter your email"
          name="email"
          handleChange={(e) => setEmail(e.target.value)}
          value={email}
          icon={<EmailIcon />}
        />

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700 dark:bg-green-900/40 dark:text-green-300">
            {success}
          </div>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
        >
          Reset Password
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
          )}
        </button>
      </form>

      <Link
        href="/auth/sign-in"
        className="mt-6 inline-block text-sm text-primary hover:underline"
      >
        ← Back to Sign In
      </Link>
    </div>
  );
}
