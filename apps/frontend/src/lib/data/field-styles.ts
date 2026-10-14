export const FIELD_LABEL_CLASS = 'text-sm font-medium text-sage-300';

export const FIELD_HINT_CLASS = 'text-xs text-sage-400';

export const fieldInputClass = (invalid: boolean) =>
	`h-12 w-full rounded-control border bg-forest-950 px-3.5 text-base text-beige-100 placeholder:text-slate-500 ${
		invalid ? 'border-coral-400' : 'border-forest-600'
	}`;
