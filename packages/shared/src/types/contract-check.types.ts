export type Assert<Condition extends true> = Condition;

export type IsAssignable<From, To> = [From] extends [To] ? true : false;

export type IsMutuallyAssignable<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
