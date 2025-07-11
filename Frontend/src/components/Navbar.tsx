const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow text-white px-4 md:px-8 py-3 flex justify-between items-center tracking-wide">
      <div className="bg-orange-500 px-4 md:px-6 py-2 text-xs font-medium">
        SCCC AI Advisor
      </div>
      <div className="text-sm font-normal text-gray-500">
        Sales Agent: Hiba
      </div>
    </nav>
  );
};

export default Navbar;