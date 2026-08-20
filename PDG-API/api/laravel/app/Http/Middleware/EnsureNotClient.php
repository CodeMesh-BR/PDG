<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureNotClient
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()?->roleName() === 'client') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
