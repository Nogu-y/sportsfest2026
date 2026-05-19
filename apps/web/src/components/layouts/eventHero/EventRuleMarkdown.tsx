import Image from "next/image";
import ReactMarkdown, { type Components } from "react-markdown";

type EventRuleMarkdownProps = {
  content: string;
  basePath: string;
};

const resolveRuleAssetPath = (src: string, basePath: string) => {
  if (src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  return `${basePath}/${src.replace(/^\.?\//, "")}`;
};

const EventRuleMarkdown = ({ content, basePath }: EventRuleMarkdownProps) => {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className="text-[22px] font-bold leading-normal text-dark">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-6 text-[18px] font-bold leading-normal text-dark">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-4 text-[16px] font-bold leading-normal text-dark">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mt-3 text-[14px] leading-7 text-dark">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-7 text-dark">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-7 text-dark">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
    img: ({ src = "", alt = "" }) => {
      if (typeof src !== "string") {
        return null;
      }

      const imageSrc = resolveRuleAssetPath(src, basePath);

      return (
        <span className="mt-4 block w-full rounded bg-primary-lite2 p-2">
          <Image
            src={imageSrc}
            alt={alt}
            width={1200}
            height={800}
            sizes="(max-width: 768px) 90vw, 640px"
            className="h-auto w-full object-contain"
          />
        </span>
      );
    },
  };

  return (
    <div className="space-y-1">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
};

export default EventRuleMarkdown;
