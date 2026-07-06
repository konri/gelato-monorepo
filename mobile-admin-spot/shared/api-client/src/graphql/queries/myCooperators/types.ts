import type {
  OperatorScopeAccess,
} from "../../types/operatorAccess";

export type MyCooperator = OperatorScopeAccess & {
  id: string;
  cooperator: {
    id: string;
    user: {
      email: string;
      name: string;
    };
  };
};

export type MyCooperatorsResponse = {
  myCooperators: MyCooperator[];
};
