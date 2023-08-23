export interface TableNotify {
	/** ID of the object being notified about. */
	id: string,

	/** Operation being performed. */
	operation: TableNotifyOperationEnum,

	/** Table being acted upon. */
	table: string,

	/** Updated timestamp of the object. */
	updated: NullTimestamp,
}

export enum TableNotifyOperationEnum {
	Create,
	Delete,
	Update,
}
