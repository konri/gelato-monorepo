type AnimatedTextProps = {
  text1: string;
  text2: string;
  text3: string;
};

const AnimatedText = ({ text1, text2, text3 }: AnimatedTextProps) => {
  return (
    <h1 className="mx-auto w-full max-w-full break-words px-1 text-2xl font-bold leading-tight xs:text-3xl sm:text-4xl sm:leading-snug md:text-5xl lg:px-0 lg:text-6xl lg:leading-relaxed lg:py-2">
      <span className="fade-in-line block">{text1}</span>
      <span className="fade-in-line block">{text2}</span>
      <span className="fade-in-line block">{text3}</span>
    </h1>
  );
};

export default AnimatedText;
