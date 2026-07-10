export type UnitOfWorkHandler<TContext, TResult> = (
	context: TContext,
) => Promise<TResult>;

export interface UnitOfWork<TContext = unknown> {
	runInTransaction<TResult>(
		handler: UnitOfWorkHandler<TContext, TResult>,
	): Promise<TResult>;
}
