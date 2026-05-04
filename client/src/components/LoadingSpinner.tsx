import React from "react";

interface Props {
  text?: string;
}

const LoadingSpinner: React.FC<Props> = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-[3px] border-brand-100" />
      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand-500 animate-spin" />
    </div>
    {text && <p className="mt-4 text-sm font-medium text-slate-400">{text}</p>}
  </div>
);

export default LoadingSpinner;
