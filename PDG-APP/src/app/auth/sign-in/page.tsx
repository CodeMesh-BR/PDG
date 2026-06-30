import Signin from "@/components/Auth/Signin";

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-dark">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <Signin />
      </div>
    </div>
  );
}
