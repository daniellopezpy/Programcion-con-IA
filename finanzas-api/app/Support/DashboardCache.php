<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;

final class DashboardCache
{
    private const TTL_SECONDS = 60;

    public function remember(int $userId, string $metric, array $parameters, Closure $callback): mixed
    {
        $version = (int) Cache::get($this->versionKey($userId), 1);
        $suffix = implode(':', array_map(static fn (mixed $value): string => (string) $value, $parameters));
        $key = implode(':', ['dashboard', 'v'.$version, $userId, $metric, $suffix]);

        return Cache::remember($key, now()->addSeconds(self::TTL_SECONDS), $callback);
    }

    public function invalidate(int $userId): void
    {
        $key = $this->versionKey($userId);

        if (! Cache::has($key)) {
            Cache::forever($key, 1);
        }

        Cache::increment($key);
    }

    private function versionKey(int $userId): string
    {
        return 'dashboard:version:'.$userId;
    }
}
