import darkLogo from "@/assets/logos/dark.svg";
import logo from "@/assets/logos/main.svg";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative mb-8 h-8 max-w-[10.847rem]">
      <Image
        src={logo}
        className="dark:hidden"
        alt="NextAdmin logo"
        role="presentation"
        width={500}
        height={500}
      />

      <Image
        src={darkLogo}
        className="hidden contrast-[0] dark:block"
        alt="NextAdmin logo"
        role="presentation"
        width={500}
        height={500}
      />
    </div>
  );
}
