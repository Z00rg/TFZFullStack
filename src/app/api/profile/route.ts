import { requireUser } from "@/server/auth/guards";
import { json, withApi } from "@/server/http/handler";
import { toAccountDto } from "@/server/services/presenters";

/** GET /api/profile — перенос `current_user_view`. */
export const GET = withApi(async () => {
    const user = await requireUser();
    return json(toAccountDto(user));
});
