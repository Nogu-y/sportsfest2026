const HorizonTitle = ({ text }: { text: string }) => {
  return (
    <div className="relative w-full px-4 h-8 flex flex-col justify-center items-center">
      <div className=" w-full h-[1px] bg-blue-400  shadow-lg"></div>
      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-1/2 text-center w-fit px-2 bg-white text-blue-400 decoration-blue-400">
        {text}
      </div>
    </div>
  );
};

export default HorizonTitle;
