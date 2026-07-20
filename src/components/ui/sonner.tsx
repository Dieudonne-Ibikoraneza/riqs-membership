import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      expand={false}
      offset={20}
      closeButton
      toastOptions={{
        duration: 4500,
        classNames: {
          toast:
            "group toast relative overflow-visible border-0 bg-[#0b3363] pl-8 text-white shadow-navy font-sans text-sm tracking-wide data-[type=success]:bg-[#0b3363] data-[type=error]:bg-[#3a0f0f] data-[type=warning]:bg-[#4a3a0a] data-[type=info]:bg-[#0b3363] data-[type=loading]:bg-[#0b3363]",
          title:
            "group-[.toast]:font-display group-[.toast]:text-[13px] group-[.toast]:font-semibold group-[.toast]:tracking-tight group-[.toast]:text-white/95",
          description:
            "group-[.toast]:text-[12px] group-[.toast]:font-normal group-[.toast]:leading-relaxed group-[.toast]:text-white/65",
          actionButton:
            "group-[.toast]:bg-gold group-[.toast]:text-[#1a1a1a] group-[.toast]:font-semibold group-[.toast]:text-xs group-[.toast]:uppercase group-[.toast]:tracking-wider group-[.toast]:h-8 group-[.toast]:px-3",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white/80 group-[.toast]:font-medium group-[.toast]:text-xs group-[.toast]:h-8 group-[.toast]:px-3 hover:group-[.toast]:bg-white/20",
          closeButton:
            "group-[.toast]:absolute group-[.toast]:top-2 group-[.toast]:left-2 group-[.toast]:bg-transparent group-[.toast]:text-white/40 group-[.toast]:border-0 group-[.toast]:hover:text-white",
          icon:
            "group-[.toast]:text-gold group-[.toast]:h-5 group-[.toast]:w-5 group-[.toast]:mt-0.5",
          loader:
            "group-[.toast]:text-gold group-[.toast]:border-gold",
          error:
            "!border-l-4 !border-l-red-500",
          success:
            "!border-l-4 !border-l-[#f1a500]",
          warning:
            "!border-l-4 !border-l-amber-400",
          info:
            "!border-l-4 !border-l-sky-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
