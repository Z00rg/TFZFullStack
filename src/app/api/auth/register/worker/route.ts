import { env } from "@/server/env";
import { ApiError } from "@/server/http/api-error";
import { clientIp } from "@/server/http/client-ip";
import { json, parseBody, withApi } from "@/server/http/handler";
import { fixedWindowRateLimit } from "@/server/redis/rate-limit";
import { createAccount } from "@/server/services/accounts";
import { toAccountDto } from "@/server/services/presenters";
import { workerRegistrationSchema } from "@/server/validation/schemas";

/**
 * POST /api/auth/register/worker — перенос `WorkerRegisterView`.
 *
 * Регистрация открыта (как и в исходном проекте), поэтому прикрыта тем же
 * лимитом по IP, что и вход: иначе эндпоинт позволял бы бесконтрольно
 * создавать аккаунты.
 */
export const POST = withApi(async (request) => {
    const { LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_SECONDS } = env();

    const limit = await fixedWindowRateLimit(
        `register:${clientIp(request)}`,
        LOGIN_RATE_LIMIT,
        LOGIN_RATE_WINDOW_SECONDS,
    );

    if (!limit.success) {
        throw ApiError.tooManyRequests(
            "Слишком много попыток регистрации. Попробуйте позже.",
            limit.retryAfter,
        );
    }

    const input = await parseBody(request, workerRegistrationSchema);

    const account = await createAccount({
        email: input.email,
        name: input.name,
        surname: input.surname,
        patronymic: input.patronymic,
        password: input.password,
        role: "WORKER",
        workerProfile: { work: input.work, position: input.position },
    });

    return json(toAccountDto(account), 201);
});
