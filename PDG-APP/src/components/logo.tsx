import darkLogo from "@/assets/logos/dark.svg";
import logo from "@/assets/logos/main.svg";

const CHECKPOINT_LOGO = `${import.meta.env.BASE_URL}logo-checkpoint.png`;

/** Checkpoint accounts get their own brand first, with PDG kept smaller. */
export function Logo({ variant = "pdg" }: { variant?: "pdg" | "checkpoint" }) {
  if (variant === "checkpoint") {
    return (
      <div className="mb-8 flex flex-col items-start gap-3">
        <img
          src={CHECKPOINT_LOGO}
          className="w-full max-w-[13rem] rounded-md"
          alt="Checkpoint Car Detailing"
        />

        <div className="relative h-5">
          <img
            src={logo}
            className="h-full w-auto dark:hidden"
            alt="PDG logo"
            role="presentation"
          />

          <img
            src={darkLogo}
            className="hidden h-full w-auto contrast-[0] dark:block"
            alt="PDG logo"
            role="presentation"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-8 h-8 max-w-[10.847rem]">
      <img
        src={logo}
        className="dark:hidden"
        alt="NextAdmin logo"
        role="presentation"
      />

      <img
        src={darkLogo}
        className="hidden contrast-[0] dark:block"
        alt="NextAdmin logo"
        role="presentation"
      />
    </div>
  );
}
