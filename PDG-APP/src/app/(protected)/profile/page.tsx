"use client";

import { Button } from "@/components/ui-elements/button";
import { useProfile } from "./useProfile";

export default function ProfilePage() {
  const {
    user,
    loading,
    error,
    message,
    currentPassword,
    newPassword,
    confirmPassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    handlePasswordChange,
  } = useProfile();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="animate-pulse text-gray-500">Loading profile...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-medium text-red-500">{error}</p>
      </div>
    );

  if (!user) return null;

  return (
    <div className="flex items-center justify-center p-6 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200 transition-all duration-200 dark:bg-gray-800 dark:ring-gray-700">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            My Profile
          </h1>
        </div>

        {/* Info Card */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900/40">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            Account Information
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-200">
            <p>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Name:
              </span>{" "}
              {user.full_name}
            </p>
            <p>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Email:
              </span>{" "}
              {user.email}
            </p>
            <p>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Role:
              </span>{" "}
              <span
                className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                  user.role === "admin"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
              >
                {user.role}
              </span>
            </p>
          </div>
        </div>

        {/* Change Password */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Change Password
          </h2>

          <div className="grid gap-3">
            <input
              type="password"
              placeholder="Current password"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-0 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New password"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-0 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-0 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {message && (
            <div
              className={`mt-2 text-sm font-medium ${
                message.toLowerCase().includes("success")
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          <div className="pt-2">
            <Button
              label="Update Password"
              onClick={handlePasswordChange}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
