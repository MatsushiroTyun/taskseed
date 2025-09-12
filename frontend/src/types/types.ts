// orderList の listKey: task#{preMemoId} | child#{taskId}
export type OrderListKey = `task#${string}` | `child#${string}`;

// ISO8601 文字列（e.g., 2025-09-07T12:34:56.789Z）
export type ISODateTime = string & {
  readonly __brand_iso_datetime: unique symbol;
};

/**
 * DynamoDB アイテム型
 */

// preMemo テーブルのアイテム型
export type PreMemoItem = {
  id: string;
  content: string;
  tag: string | "";
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type POSTPreMemoItem = {
  content: string;
  tag: string | "";
};

export type PUTPreMemoItem = {
  id: string;
  content?: string;
  tag?: string | "";
};

// task テーブルのアイテム型
export type TaskItem = {
  id: string;
  memo: string;
  title: string;
  detail: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type POSTTaskItem = {
  memo: string;
  title: string;
  detail: string;
};

export type PUTTaskItem = {
  id: string;
  title?: string;
  detail?: string;
};

// childTask テーブルのアイテム型
export type ChildTaskItem = {
  id: string;
  parent: string;
  title: string;
  detail: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type POSTChildTaskItem = {
  parent: string;
  title: string;
  detail: string;
};

export type PUTChildTaskItem = {
  id: string;
  title?: string;
  detail?: string;
};

// orderList テーブルのアイテム型
export type OrderListItem = {
  listKey: OrderListKey;
  list: string[];
  version: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type GETOrderListItem = {
  listKey: OrderListKey;
};

// tag テーブルのアイテム型
export type TagItem = {
  id: string;
  title: string;
  color: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type POSTTagItem = {
  title: string;
  color: string;
};

export type PUTTagItem = {
  id: string;
  title?: string;
  color?: string;
};

// color テーブルのアイテム型
export type ColorItem = {
  id: string;
  title: string;
  code: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type POSTColorItem = {
  title: string;
  code: string;
};

export type PUTColorItem = {
  id: string;
  title?: string;
  code?: string;
};
