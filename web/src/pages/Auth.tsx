import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useStore } from "../store/store";

type FormData = {
  email: string;
  password: string;
};

function Auth(){
  const navigate = useNavigate();
  const setUserId = useStore((state) => state.setUserId);
  const [isSignUp, setIsSignUp] = useState<boolean>(true);
  const [isEyeOpen, setIsEyeOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const { signup, login, signupIsPending, loginIsPending } = useAuth();

  const isPending = signupIsPending || loginIsPending;

  async function handleAuth(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;

    try {
      if (isSignUp) {
        const result = await signup(formData);
        if (!result.success) {
          toast.error(result.error ?? "Couldn't create your account.");
          return;
        }
        if (typeof result.id !== "number") {
          toast.error(
            "Signup succeeded, but the server did not return a user ID.",
          );
          return;
        }
        setUserId(result.id);
        toast.success(result.message ?? "Your Drawly account is ready.");
        navigate("/draw");
      } else {
        const result = await login(formData);
        if (!result.success) {
          toast.error(result.error ?? "Login failed. Check your credentials.");
          return;
        }
        if (typeof result.id !== "number") {
          toast.error(
            "Login succeeded, but the server did not return a user ID.",
          );
          return;
        }
        setUserId(result.id);
        toast.success(result.message ?? "Welcome back to Drawly.");
        navigate("/draw");
      }
    } catch {
      toast.error(
        isSignUp
          ? "Couldn't create your account. Check your details and try again."
          : "Login failed. Check your email and password.",
      );
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleModeChange() {
    setIsSignUp((prev) => !prev);
    setFormData({ email: "", password: "" });
  }

  return (
    <main className="grid min-h-screen min-h-[100svh] place-items-center bg-[#0a1210] p-0 [background-image:radial-gradient(#20312b_0.8px,transparent_0.8px)] [background-size:18px_18px] sm:p-5 lg:p-7">
      <div className="grid min-h-[100svh] w-full max-w-[1120px] overflow-hidden bg-[#111c1a] shadow-[0_24px_70px_rgba(0,0,0,0.42)] sm:min-h-[min(760px,calc(100svh-40px))] sm:grid-cols-[1.02fr_.98fr] sm:rounded-xl">
        <section
          aria-label="A shared drawing space"
          className="relative flex min-h-[390px] flex-col overflow-hidden bg-[#153b35] px-6 pt-6 pb-5 text-[#f3f6ef] [background-image:radial-gradient(rgba(255,255,255,0.11)_0.8px,transparent_0.8px)] [background-size:17px_17px] sm:min-h-0 sm:px-8 sm:pt-9 sm:pb-7 lg:px-[52px] lg:pt-11 lg:pb-9"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-[#f2ce72] text-lg font-bold text-[#153b35]">
              D
            </span>
            <span className="text-base font-bold tracking-[0.01em] text-[#f3f6ef]">
              Drawly
            </span>
          </div>

          <div className="relative z-10 mt-8 sm:mt-13">
            <p className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-[#b7d9c8] sm:mb-5 sm:text-[11px]">
              <span className="size-2 animate-pulse rounded-full bg-[#e9795b] ring-4 ring-[#e9795b]/20" />
              ROOM FOR YOUR NEXT IDEA
            </p>
            <h2 className="m-0 font-serif text-[34px] leading-[1.08] font-semibold sm:text-[40px] lg:text-[48px]">
              Make it up.
              <br />
              <em className="font-semibold text-[#f2ce72]">
                Make it together.
              </em>
            </h2>
            <p className="mt-3 max-w-[350px] text-[13px] leading-6 text-[#e0e9e2]/75 sm:mt-4 sm:text-[15px] sm:leading-[1.7]">
              A shared canvas for the sketches, sparks, and plans worth bringing
              to life.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="relative mt-auto min-h-[105px] overflow-hidden rounded-lg border border-white/10 bg-[#1c2a26] [background-image:radial-gradient(#34453d_0.7px,transparent_0.7px)] [background-size:15px_15px] sm:min-h-[170px] lg:min-h-[205px]"
          >
            <span className="absolute top-3 left-3 z-10 text-[10px] font-semibold text-[#a9b9ae] sm:top-4 sm:left-4">
              Untitled idea
            </span>
            <div className="absolute top-9 left-[18%] size-10 rounded-full bg-[#e9795b] shadow-[0_0_0_8px_rgba(233,121,91,0.13)] sm:top-12 sm:size-[72px] sm:shadow-[0_0_0_10px_rgba(233,121,91,0.13)]" />
            <div className="absolute right-[21%] bottom-4 h-[54px] w-[68px] rotate-[7deg] rounded-t-full rounded-b-md border-2 border-[#418c7d] sm:bottom-[30px] sm:h-[97px] sm:w-[117px]" />
            <div className="absolute top-8 left-[43%] z-10 flex rotate-[-5deg] flex-col gap-1 bg-[#f2ce72] px-3 py-2 text-[10px] leading-tight text-[#34483e] shadow-lg sm:top-10 sm:px-4 sm:py-3 sm:text-[13px]">
              <span className="font-serif">good things</span>
              <span className="font-serif">start here</span>
              <i className="absolute right-3 bottom-1.5 h-[5px] w-[22px] rotate-[-12deg] rounded-[50%] border-t border-[#71805d]" />
            </div>
            <div className="absolute top-10 right-[8%] h-14 w-6 rotate-[29deg] rounded-[50%] border-r-2 border-[#e48c6f] sm:top-[49px] sm:h-20 sm:w-[34px]" />
            <span className="absolute right-3 bottom-2 text-[9px] font-semibold text-[#9aa99f] sm:right-4 sm:bottom-3">
              A little room to think.
            </span>
          </div>
        </section>

        <section className="flex flex-col justify-center bg-[#111c1a] px-6 py-9 sm:px-9 sm:py-10 lg:px-[clamp(36px,6vw,76px)] lg:py-14">
          <div className="mx-auto w-full max-w-[380px]">
            <header className="mb-7 sm:mb-[34px]">
              <p className="mb-3 text-[11px] font-bold tracking-[0.12em] text-[#76cdb5]">
                {isSignUp ? "GET STARTED" : "GOOD TO SEE YOU"}
              </p>
              <h1 className="m-0 text-[27px] leading-tight font-bold text-[#f3f6ef] sm:text-[30px]">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-[#a4b2aa]">
                {isSignUp
                  ? "Sign up to start using the platform"
                  : "Login to continue to your account"}
              </p>
            </header>

            <form
              onSubmit={handleAuth}
              className="flex flex-col gap-[18px] sm:gap-[21px]"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[13px] font-semibold text-[#d5e0d9]"
                >
                  Email address
                </label>
                <div className="relative flex items-center">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 text-[#899b91]"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={formData.email}
                    disabled={isPending}
                    onChange={handleInputChange}
                    required
                    className="h-[50px] w-full rounded-md border border-[#344640] bg-[#0b1513] pr-4 pl-[43px] text-sm text-[#f3f6ef] outline-none transition placeholder:text-[#82958b] hover:border-[#58756a] focus-visible:border-[#67c9ad] focus-visible:ring-[3px] focus-visible:ring-[#67c9ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-[13px] font-semibold text-[#d5e0d9]"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 text-[#899b91]"
                  />
                  <input
                    id="password"
                    name="password"
                    type={isEyeOpen ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    value={formData.password}
                    disabled={isPending}
                    onChange={handleInputChange}
                    required
                    className="h-[50px] w-full rounded-md border border-[#344640] bg-[#0b1513] pr-[46px] pl-[43px] text-sm text-[#f3f6ef] outline-none transition placeholder:text-[#82958b] hover:border-[#58756a] focus-visible:border-[#67c9ad] focus-visible:ring-[3px] focus-visible:ring-[#67c9ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setIsEyeOpen((prev) => !prev)}
                    className="absolute right-2 grid size-9 place-items-center rounded-md text-[#9aaba1] transition hover:bg-[#22342e] hover:text-[#dff8ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#67c9ad] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={isEyeOpen ? "Hide password" : "Show password"}
                  >
                    {isEyeOpen ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-1 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-md bg-[#62c9a9] px-4 text-sm font-bold text-[#082018] transition hover:-translate-y-px hover:bg-[#83dfbe] hover:shadow-[0_8px_20px_rgba(78,199,160,0.18)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe] disabled:cursor-not-allowed disabled:opacity-65"
              >
                {isPending && <Loader2 size={18} className="animate-spin" />}
                {isPending
                  ? "Please wait..."
                  : isSignUp
                    ? "Create account"
                    : "Login"}
              </button>
            </form>

            <div className="mt-6 border-t border-[#293a34] pt-5 text-center">
              <p className="text-[13px] text-[#a4b2aa]">
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleModeChange}
                  className="ml-1 rounded-sm px-0.5 py-0.5 font-bold text-[#76cdb5] transition hover:text-[#a0ead2] hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#67c9ad] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isSignUp ? "Login" : "Sign up"}
                </button>
              </p>
            </div>
          </div>

          <p className="mx-auto mt-7 max-w-[380px] text-center text-[11px] leading-relaxed text-[#819188]">
            By continuing, you agree to our terms and privacy policy.
          </p>
        </section>
      </div>
    </main>
  );
};

export default Auth;
