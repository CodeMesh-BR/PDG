import { Logo } from "@/components/logo";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  return (
    <>
      <div className="my-6 flex items-center justify-center">
        <Logo />
      </div>

      <div>
        <SigninWithPassword />
      </div>
    </>
  );
}
