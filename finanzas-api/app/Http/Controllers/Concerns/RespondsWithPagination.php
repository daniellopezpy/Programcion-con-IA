<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

trait RespondsWithPagination
{
    protected function paginatedJson(LengthAwarePaginator $paginator): JsonResponse
    {
        $payload = $paginator->toArray();

        return response()->json([
            'data' => $payload['data'],
            'meta' => [
                'current_page' => $payload['current_page'],
                'from' => $payload['from'],
                'last_page' => $payload['last_page'],
                'per_page' => $payload['per_page'],
                'to' => $payload['to'],
                'total' => $payload['total'],
            ],
            'links' => [
                'first' => $payload['first_page_url'],
                'last' => $payload['last_page_url'],
                'prev' => $payload['prev_page_url'],
                'next' => $payload['next_page_url'],
            ],
        ]);
    }
}
