import { forwardRef, memo } from "react";
const SvgLogo = (
	props: React.SVGProps<SVGSVGElement>,
	ref: React.Ref<SVGSVGElement>,
) => (
	// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
	<svg
		width={196}
		height={259}
		viewBox="0 0 196 259"
		fill="none"
		ref={ref}
		{...props}
	>
		<path
			d="M15 243.5V83C15 45.4446 45.4446 15 83 15H133C159.51 15 181 36.4903 181 63V82.5C181 106.248 161.748 125.5 138 125.5H106.083C86.9835 125.5 71.5 140.983 71.5 160.083V160.083C71.5 186.823 93.1769 208.5 119.917 208.5H127.5H132.19C155.076 208.5 175.103 193.114 181 171V171"
			stroke="currentColor"
			strokeWidth={30}
			strokeLinecap="round"
		/>
		<circle cx={127} cy={74.5} r={18.5} fill="currentColor" />
		<circle cx={71} cy={74.5} r={11.5} fill="currentColor" />
	</svg>
);
const ForwardRef = forwardRef(SvgLogo);
const Memo = memo(ForwardRef);
export default Memo;
