import { httpClient } from "../../services/httpClient";
import type { DataErasureRequest } from "../../types";

export const usersApi = {
  requestDataErasure: async (userId: string): Promise<DataErasureRequest> => {
    const res = await httpClient.delete<DataErasureRequest>(
      `/api/users/${userId}/data`,
    );
    return res.data;
  },
};
