<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Blocks the given roles (defaults to `client` when used without parameters,
 * e.g. `not-client`; `deny-roles:client,checkpoint_admin` for a custom list).
 */
class EnsureNotClient
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $denied = $roles ?: ['client'];
        $denied = array_map(fn ($role) => strtolower(trim($role)), $denied);

        if (in_array($request->user()?->roleName(), $denied, true)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
