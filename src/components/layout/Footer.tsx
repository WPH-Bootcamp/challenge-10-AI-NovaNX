export function Footer() {
  return (
    <footer className="mt-auto bg-white">
      {/* Mobile default footer */}
      <div className="md:hidden">
        <div className="mx-auto w-full max-w-107.5 px-4">
          <div className="border-t border-[#D5D7DA]" />
        </div>
        <div className="mx-auto w-full max-w-107.5 px-4 pb-10 pt-6">
          <p className="whitespace-nowrap text-center text-[13px] text-black/60 sm:text-[14px]">
            © 2025 Web Programming Hack Blog All rights reserved.
          </p>
        </div>
      </div>

      {/* Desktop (md+) footer */}
      <div className="hidden md:block">
        <div className="mx-auto w-full max-w-5xl px-4">
          <div className="border-t border-[#D5D7DA]" />
        </div>
        <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6">
          <p className="whitespace-nowrap text-center text-[14px] text-black/60">
            © 2025 Web Programming Hack Blog All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
