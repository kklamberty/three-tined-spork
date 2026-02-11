export interface Todo {
  _id: string;
  owner: string;
  status: boolean;
  body: string;
  category: CategoryOption;
}

export type CategoryOption = 'groceries' | 'homework' | 'video games' | 'software design';
